class_name MobileThumbZoneLayout
extends Control
## Mengelola Safe Area Layar Ponsel Berponi (Notch / Cutout) & Ergonomi "Thumb Zone".
## Menyesuaikan margin kontrol sentuh agar pas di jangkauan jempol dan tidak tertutup poni HP.

@export var margin_safe_padding: int = 24

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_apply_notch_safe_area()

func _apply_notch_safe_area() -> void:
	# Ambil Safe Area bawaan OS perangkat Android/iOS
	var safe_area: Rect2i = DisplayServer.get_display_safe_area()
	var screen_size: Vector2i = DisplayServer.window_get_size()
	
	if safe_area.size.x > 0 and safe_area.size.y > 0 and screen_size.x > 0:
		var left_inset: int = safe_area.position.x
		var right_inset: int = screen_size.x - (safe_area.position.x + safe_area.size.x)
		var top_inset: int = safe_area.position.y
		var bottom_inset: int = screen_size.y - (safe_area.position.y + safe_area.size.y)
		
		# Terapkan offset tambahan jika ponsel memiliki poni/notch
		offset_left = maxi(margin_safe_padding, left_inset)
		offset_right = -maxi(margin_safe_padding, right_inset)
		offset_top = maxi(margin_safe_padding, top_inset)
		offset_bottom = -maxi(margin_safe_padding, bottom_inset)

