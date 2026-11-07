class_name TouchControls
extends Control
## Layer Root untuk Mengelola Dual-Scheme Touch Controls (Joystick & Tap-to-Move vs Orbit Drag)
## serta Tombol Aksi Pertarungan Mobile (Attack, Dash, Skill 1/2, Weapon Swap, Armor Swap, Stats).

@onready var joystick: TouchJoystick = $SafeThumbZone/LeftZone/VirtualJoystick
@onready var tap_indicator: Control = $TapIndicator
@onready var attack_button: BaseButton = $SafeThumbZone/CombatButtons/AttackButton
@onready var dash_button: BaseButton = $SafeThumbZone/CombatButtons/DashButton
@onready var skill1_button: BaseButton = $SafeThumbZone/CombatButtons/Skill1Button
@onready var skill2_button: BaseButton = $SafeThumbZone/CombatButtons/Skill2Button
@onready var swap_weapon_button: BaseButton = $SafeThumbZone/CombatButtons/SwapButton
@onready var swap_armor_button: BaseButton = $SafeThumbZone/CombatButtons/ArmorButton
@onready var stats_button: BaseButton = $SafeThumbZone/CombatButtons/StatsButton

var _tap_alpha: float = 0.0

# Pelacakan Hybrid Touch di RightZone
var _touch_pointers: Dictionary = {} # index -> Dictionary { "start_pos": Vector2, "current_pos": Vector2, "is_drag": bool }
var _pinch_initial_distance: float = 0.0

func _ready() -> void:
	if tap_indicator != null:
		tap_indicator.visible = false
	if attack_button != null:
		attack_button.pressed.connect(_on_attack_pressed)
	if dash_button != null:
		dash_button.pressed.connect(_on_dash_pressed)
	if skill1_button != null:
		skill1_button.pressed.connect(func(): _on_skill_pressed(1))
	if skill2_button != null:
		skill2_button.pressed.connect(func(): _on_skill_pressed(2))
	if swap_weapon_button != null:
		swap_weapon_button.pressed.connect(_on_swap_weapon_pressed)
	if swap_armor_button != null:
		swap_armor_button.pressed.connect(_on_swap_armor_pressed)
	if stats_button != null:
		stats_button.pressed.connect(_on_stats_pressed)

func _process(delta: float) -> void:
	if _tap_alpha > 0.0:
		_tap_alpha = maxf(0.0, _tap_alpha - delta * 2.5)
		if tap_indicator != null:
			tap_indicator.modulate.a = _tap_alpha
			if _tap_alpha <= 0.0:
				tap_indicator.visible = false

func _on_right_zone_gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			_touch_pointers[touch.index] = {
				"start_pos": touch.position,
				"current_pos": touch.position,
				"is_drag": false
			}
			if _touch_pointers.size() == 2:
				var keys: Array = _touch_pointers.keys()
				var p1: Vector2 = _touch_pointers[keys[0]]["current_pos"]
				var p2: Vector2 = _touch_pointers[keys[1]]["current_pos"]
				_pinch_initial_distance = p1.distance_to(p2)
		else:
			if _touch_pointers.has(touch.index):
				var data: Dictionary = _touch_pointers[touch.index]
				if not data["is_drag"] and _touch_pointers.size() == 1:
					_handle_tap_to_move(touch.position)
				_touch_pointers.erase(touch.index)
				if _touch_pointers.size() < 2:
					_pinch_initial_distance = 0.0

	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		if _touch_pointers.has(drag.index):
			_touch_pointers[drag.index]["current_pos"] = drag.position
			var start_p: Vector2 = _touch_pointers[drag.index]["start_pos"]
			if start_p.distance_to(drag.position) > 15.0:
				_touch_pointers[drag.index]["is_drag"] = true

		if _touch_pointers.size() == 1 and _touch_pointers.has(drag.index):
			if _touch_pointers[drag.index]["is_drag"]:
				if EventBus != null:
					EventBus.camera_orbit_dragged.emit(drag.relative)
		elif _touch_pointers.size() >= 2:
			var keys: Array = _touch_pointers.keys()
			var p1: Vector2 = _touch_pointers[keys[0]]["current_pos"]
			var p2: Vector2 = _touch_pointers[keys[1]]["current_pos"]
			var current_dist: float = p1.distance_to(p2)
			if _pinch_initial_distance > 0.0:
				var delta_dist: float = current_dist - _pinch_initial_distance
				if absf(delta_dist) > 2.0:
					if EventBus != null:
						EventBus.camera_zoom_requested.emit(-delta_dist * 0.04)
					_pinch_initial_distance = current_dist

	elif event is InputEventMouseButton:
		var mouse := event as InputEventMouseButton
		if mouse.pressed and mouse.button_index == MOUSE_BUTTON_LEFT:
			_handle_tap_to_move(mouse.position)

func _handle_tap_to_move(screen_pos: Vector2) -> void:
	var cam: Camera3D = get_viewport().get_camera_3d()
	if cam == null:
		return
	
	var ray_origin: Vector3 = cam.project_ray_origin(screen_pos)
	var ray_dir: Vector3 = cam.project_ray_normal(screen_pos)
	var ray_end: Vector3 = ray_origin + ray_dir * 100.0

	# Menggunakan Physics Raycast 3D pada collision layer 1 (World / Floors / Stairs)
	var space_state: PhysicsDirectSpaceState3D = cam.get_world_3d().direct_space_state
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(ray_origin, ray_end, 1)
	var result: Dictionary = space_state.intersect_ray(query)

	var target_world_pos: Vector3 = Vector3.ZERO
	if not result.is_empty():
		target_world_pos = result["position"]
	else:
		# Fallback ke ground plane jika raycast tidak mengenai collider
		var ground_plane: Plane = Plane(Vector3.UP, 0.0)
		var hit_pos: Variant = ground_plane.intersects_ray(ray_origin, ray_dir)
		if hit_pos == null:
			return
		target_world_pos = hit_pos as Vector3

	_show_tap_indicator(screen_pos)

	if EventBus != null:
		EventBus.move_target_requested.emit(target_world_pos)

func _show_tap_indicator(screen_pos: Vector2) -> void:
	if tap_indicator == null:
		return
	tap_indicator.position = screen_pos
	tap_indicator.visible = true
	_tap_alpha = 1.0
	tap_indicator.modulate.a = _tap_alpha

func _on_attack_pressed() -> void:
	if EventBus != null:
		EventBus.attack_button_pressed.emit()

func _on_dash_pressed() -> void:
	if EventBus != null:
		EventBus.dash_button_pressed.emit()

func _on_skill_pressed(skill_idx: int) -> void:
	if EventBus != null:
		EventBus.skill_button_pressed.emit(skill_idx)

func _on_swap_weapon_pressed() -> void:
	if EventBus != null:
		EventBus.weapon_swap_requested.emit()

func _on_swap_armor_pressed() -> void:
	if EventBus != null:
		EventBus.armor_swap_requested.emit()

func _on_stats_pressed() -> void:
	if EventBus != null:
		EventBus.stats_modal_toggled.emit()
