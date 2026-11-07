class_name TouchJoystick
extends Control
## Dynamic / Floating Virtual Joystick dengan visual Rune Kuno & Permata Kristal.
## Muncul di area sentuhan jempol dan memiliki transisi opacity halus (fade out).

signal joystick_vector_changed(vector: Vector2)
signal joystick_released()

const BASE_TEXTURE: Texture2D = preload("res://assets/ui/joystick_base.png")
const THUMB_TEXTURE: Texture2D = preload("res://assets/ui/joystick_thumb.png")

@export var max_radius: float = 80.0
@export var dead_zone: float = 0.15

var _touch_index: int = -1
var _base_position: Vector2 = Vector2.ZERO
var _current_thumb_position: Vector2 = Vector2.ZERO
var _output_vector: Vector2 = Vector2.ZERO

var _base_sprite: Sprite2D = null
var _thumb_sprite: Sprite2D = null
var _fade_alpha: float = 0.0

func _ready() -> void:
	visible = true
	modulate.a = 0.0
	_setup_sprites()

func _setup_sprites() -> void:
	_base_sprite = Sprite2D.new()
	_base_sprite.texture = BASE_TEXTURE
	add_child(_base_sprite)
	
	_thumb_sprite = Sprite2D.new()
	_thumb_sprite.texture = THUMB_TEXTURE
	add_child(_thumb_sprite)

func _process(delta: float) -> void:
	# Transisi lerp alpha halus saat disentuh vs idle
	var target_alpha: float = 1.0 if _touch_index != -1 else 0.0
	_fade_alpha = move_toward(_fade_alpha, target_alpha, delta * 5.0)
	modulate.a = _fade_alpha

func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var touch: InputEventScreenTouch = event as InputEventScreenTouch
		if touch.pressed and _touch_index == -1:
			_start_touch(touch.index, touch.position)
		elif not touch.pressed and touch.index == _touch_index:
			_end_touch()
			
	elif event is InputEventScreenDrag:
		var drag: InputEventScreenDrag = event as InputEventScreenDrag
		if drag.index == _touch_index:
			_update_drag(drag.position)

func _start_touch(index: int, pos: Vector2) -> void:
	_touch_index = index
	_base_position = pos
	_current_thumb_position = pos
	_output_vector = Vector2.ZERO
	
	_base_sprite.position = _base_position
	_thumb_sprite.position = _current_thumb_position
	
	var event_bus: Node = get_node_or_null("/root/EventBus")
	if event_bus != null and event_bus.has_signal("move_target_cancelled"):
		event_bus.emit_signal("move_target_cancelled")

func _update_drag(pos: Vector2) -> void:
	var offset: Vector2 = pos - _base_position
	var distance: float = offset.length()
	
	if distance > max_radius:
		offset = offset.normalized() * max_radius
		
	_current_thumb_position = _base_position + offset
	_thumb_sprite.position = _current_thumb_position
	
	# Hitung output vector ternormalisasi
	var normalized_dist: float = distance / max_radius
	if normalized_dist < dead_zone:
		_output_vector = Vector2.ZERO
	else:
		var remapped_dist: float = (normalized_dist - dead_zone) / (1.0 - dead_zone)
		_output_vector = offset.normalized() * clampf(remapped_dist, 0.0, 1.0)
		
	joystick_vector_changed.emit(_output_vector)
	
	var event_bus: Node = get_node_or_null("/root/EventBus")
	if event_bus != null and event_bus.has_signal("joystick_moved"):
		event_bus.emit_signal("joystick_moved", _output_vector)

func _end_touch() -> void:
	_touch_index = -1
	_output_vector = Vector2.ZERO
	
	joystick_vector_changed.emit(Vector2.ZERO)
	joystick_released.emit()
	
	var event_bus: Node = get_node_or_null("/root/EventBus")
	if event_bus != null and event_bus.has_signal("joystick_released"):
		event_bus.emit_signal("joystick_released")
