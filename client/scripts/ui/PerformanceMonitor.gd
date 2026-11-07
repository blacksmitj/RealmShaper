class_name PerformanceMonitor
extends Control
## Performance & FPS Profiler Overlay untuk Pengujian Mobile (Android/iOS).
## Menampilkan FPS, Frame Time, Draw Calls, dan Estimasi Penggunaan Memori VRAM/RAM.

@onready var stats_label: Label = $StatsLabel

var _update_timer: float = 0.0
const UPDATE_INTERVAL: float = 0.25 # Update 4 kali per detik agar tidak membebani render

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _process(delta: float) -> void:
	_update_timer -= delta
	if _update_timer <= 0.0:
		_update_timer = UPDATE_INTERVAL
		_refresh_stats()

func _refresh_stats() -> void:
	if stats_label == null:
		return
		
	var fps: float = Performance.get_monitor(Performance.TIME_FPS)
	var process_time: float = Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0
	var static_mem_mb: float = Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0)
	var draw_calls: int = int(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME))
	var objects: int = int(Performance.get_monitor(Performance.OBJECT_COUNT))
	
	stats_label.text = "FPS: %d (%.1f ms) | Draw Calls: %d\nRAM: %.1f MB | Objects: %d" % [
		int(fps), process_time, draw_calls, static_mem_mb, objects
	]
	
	# Indikasi warna performa
	if fps >= 55.0:
		stats_label.modulate = Color(0.3, 1.0, 0.4) # Hijau stabil 60 FPS
	elif fps >= 30.0:
		stats_label.modulate = Color(1.0, 0.85, 0.2) # Kuning
	else:
		stats_label.modulate = Color(1.0, 0.3, 0.3) # Merah drop frame

