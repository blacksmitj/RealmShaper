class_name OrbitCamera3D
extends Node3D
## Kamera Orbit 360° untuk Perspektif 2.5D / Ragnarok Online Classic.
## Mendukung rotasi horizontal bebas (Yaw), sudut elevasi terbatas (Pitch), dan Zoom (SpringArm).

@export var target: Node3D = null
@export var target_offset: Vector3 = Vector3(0.0, 1.35, 0.0)
@export var enable_wall_collision: bool = false
@export var follow_speed: float = 12.0
@export var mouse_sensitivity: float = 0.005
@export var zoom_speed: float = 2.0
@export var min_zoom: float = 5.0
@export var max_zoom: float = 25.0
@export var min_pitch: float = deg_to_rad(-70.0) # Melihat hampir vertikal dari atas
@export var max_pitch: float = deg_to_rad(-15.0) # Sudut rendah sejajar mata

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

var _is_orbiting: bool = false
var _target_yaw: float = 0.0
var _target_pitch: float = deg_to_rad(-35.0)
var _target_zoom: float = 12.0

func _ready() -> void:
	rotation.y = _target_yaw
	rotation.x = _target_pitch
	if spring_arm != null:
		spring_arm.spring_length = _target_zoom
		spring_arm.collision_mask = 1 if enable_wall_collision else 0
		if target is CollisionObject3D:
			spring_arm.add_excluded_object((target as CollisionObject3D).get_rid())

	if EventBus != null:
		EventBus.camera_orbit_dragged.connect(_on_camera_orbit_dragged)
		EventBus.camera_zoom_requested.connect(_on_camera_zoom_requested)

func _on_camera_orbit_dragged(relative_motion: Vector2) -> void:
	_target_yaw -= relative_motion.x * mouse_sensitivity
	_target_pitch -= relative_motion.y * mouse_sensitivity
	_target_pitch = clampf(_target_pitch, min_pitch, max_pitch)

func _on_camera_zoom_requested(zoom_delta: float) -> void:
	_target_zoom = clampf(_target_zoom + zoom_delta, min_zoom, max_zoom)

func _unhandled_input(event: InputEvent) -> void:
	# Kontrol Rotasi via Klik Kanan Mouse (Drag)
	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_RIGHT:
			_is_orbiting = mouse_event.pressed
		elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_target_zoom = clampf(_target_zoom - zoom_speed, min_zoom, max_zoom)
		elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_target_zoom = clampf(_target_zoom + zoom_speed, min_zoom, max_zoom)

	elif event is InputEventMouseMotion and _is_orbiting:
		var motion := event as InputEventMouseMotion
		_target_yaw -= motion.relative.x * mouse_sensitivity
		_target_pitch -= motion.relative.y * mouse_sensitivity
		_target_pitch = clampf(_target_pitch, min_pitch, max_pitch)

func _process(delta: float) -> void:
	# Rotasi via Tombol Keyboard (Q & E)
	var keyboard_rot: float = 0.0
	if Input.is_key_pressed(KEY_Q):
		keyboard_rot += 2.0 * delta
	if Input.is_key_pressed(KEY_E):
		keyboard_rot -= 2.0 * delta
	
	if not is_zero_approx(keyboard_rot):
		_target_yaw += keyboard_rot

	# Interpolasi rotasi dan zoom kamera secara halus
	rotation.y = lerp_angle(rotation.y, _target_yaw, 15.0 * delta)
	rotation.x = lerp(rotation.x, _target_pitch, 15.0 * delta)
	
	if spring_arm != null:
		spring_arm.spring_length = lerp(spring_arm.spring_length, _target_zoom, 10.0 * delta)

	# Mengikuti posisi dada/bahu target di dunia (bukan telapak kaki)
	if target != null:
		var desired_pos: Vector3 = target.global_position + target_offset
		global_position = global_position.lerp(desired_pos, follow_speed * delta)

## Mengembalikan arah hadap horizontal (Yaw) kamera saat ini
func get_camera_yaw() -> float:
	return rotation.y

