class_name DamageNumber
extends Label3D
## Menampilkan angka damage mengambang di ruang 3D (Billboard) dengan efek bounce & fade out.

var _velocity: Vector3 = Vector3(0.0, 3.2, 0.0)
var _gravity: float = 6.5
var _lifetime: float = 0.85
var _current_time: float = 0.0
var _base_scale: float = 1.0

func init(amount: int, is_crit: bool = false, attack_type: String = "PHYSICAL") -> void:
	billboard = BaseMaterial3D.BILLBOARD_ENABLED
	no_depth_test = true
	outline_size = 10
	outline_modulate = Color.BLACK
	font_size = 42 if is_crit else 32
	pixel_size = 0.01

	text = str(amount) + ("!" if is_crit else "")
	if is_crit:
		modulate = Color(1.0, 0.85, 0.2) # Kuning emas menyala
		_base_scale = 1.35
	elif attack_type == "MAGIC":
		modulate = Color(0.8, 0.45, 1.0) # Ungu sihir
		_base_scale = 1.15
	else:
		modulate = Color(1.0, 0.35, 0.3) # Merah fisik
		_base_scale = 1.0

	scale = Vector3.ONE * _base_scale
	_velocity.x = randf_range(-1.2, 1.2)
	_velocity.z = randf_range(-1.2, 1.2)

func _process(delta: float) -> void:
	_current_time += delta
	position += _velocity * delta
	_velocity.y -= _gravity * delta

	var progress: float = _current_time / _lifetime
	if progress < 0.2:
		var pop: float = progress / 0.2
		scale = Vector3.ONE * _base_scale * (0.8 + pop * 0.4)
	else:
		var alpha: float = clampf(1.0 - (progress - 0.2) / 0.8, 0.0, 1.0)
		modulate.a = alpha
		outline_modulate.a = alpha

	if _current_time >= _lifetime:
		queue_free()
