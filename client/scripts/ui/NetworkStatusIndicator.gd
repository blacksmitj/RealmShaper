extends Label
## Menampilkan status koneksi jaringan WebSocket secara real-time di layar.

func _ready() -> void:
	text = "Network: Connecting..."
	if NetworkManager != null:
		NetworkManager.connection_status_changed.connect(_on_status_changed)

func _on_status_changed(status_text: String) -> void:
	text = "Network: " + status_text
	if status_text.begins_with("CONNECTED"):
		modulate = Color(0.2, 1.0, 0.3) # Hijau
	elif status_text.begins_with("RECONNECTING"):
		modulate = Color(1.0, 0.8, 0.2) # Kuning
	else:
		modulate = Color(1.0, 0.3, 0.3) # Merah

