class_name CommunityPortalDialog
extends Control
## UI Modal Portal Komunitas untuk mengunduh dan berganti ke Map PGC
## buatan kreator secara instan via REST API / Server Cache.

const API_SERVER_URL: String = "http://127.0.0.1:8080"
const LOCAL_MAPS_DIR: String = "user://maps/"

@onready var panel: Panel = $Panel
@onready var title_label: Label = $Panel/TitleLabel
@onready var map_list_container: VBoxContainer = $Panel/ScrollContainer/MapListContainer
@onready var close_button: Button = $Panel/CloseButton

var _http_list_request: HTTPRequest = null
var _http_download_request: HTTPRequest = null
var _current_downloading_id: String = ""

var default_maps: Array[Dictionary] = [
	{
		"id": "main_city",
		"name": "Main Sanctuary (Official Realm)",
		"author": "RealmShaper Team",
		"path": "main_city",
		"is_local": true
	},
	{
		"id": "community_dungeon_01",
		"name": "Forgotten Crypt (PGC Catacombs)",
		"author": "ShadowCrafter",
		"path": "res://assets/data/maps/community_dungeon_01.json",
		"is_local": true
	}
]

var published_maps: Array[Dictionary] = []

func _ready() -> void:
	visible = false
	if close_button != null:
		close_button.pressed.connect(_on_close_pressed)
	if EventBus != null:
		EventBus.portal_triggered.connect(_on_portal_triggered)

	# Buat HTTPRequest node untuk sync data map dari server
	_http_list_request = HTTPRequest.new()
	_http_list_request.name = "HTTPListRequest"
	_http_list_request.request_completed.connect(_on_list_request_completed)
	add_child(_http_list_request)

	_http_download_request = HTTPRequest.new()
	_http_download_request.name = "HTTPDownloadRequest"
	_http_download_request.request_completed.connect(_on_download_request_completed)
	add_child(_http_download_request)

	_ensure_maps_directory()
	_render_maps()

func _ensure_maps_directory() -> void:
	var dir: DirAccess = DirAccess.open("user://")
	if dir != null and not dir.dir_exists("maps"):
		dir.make_dir("maps")

func _on_portal_triggered(_target_id: String) -> void:
	visible = true
	_fetch_published_maps()

func _fetch_published_maps() -> void:
	if _http_list_request == null:
		return
	if title_label != null:
		title_label.text = "Realm Portal (Menghubungkan ke Server...)"
	var url: String = API_SERVER_URL + "/api/maps/public"
	var err: Error = _http_list_request.request(url)
	if err != OK:
		if title_label != null:
			title_label.text = "Realm Portal (Mode Offline)"
		_render_maps()

func _on_list_request_completed(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var json: JSON = JSON.new()
		if json.parse(body.get_string_from_utf8()) == OK and json.data is Array:
			published_maps.clear()
			for item in json.data:
				if item is Dictionary:
					published_maps.append(item)
			if title_label != null:
				title_label.text = "Realm Portal (Tersinkronisasi Online)"
		else:
			if title_label != null:
				title_label.text = "Realm Portal (Portal Terbuka)"
	else:
		if title_label != null:
			title_label.text = "Realm Portal (Offline / Server tidak terjangkau)"

	_render_maps()

func _render_maps() -> void:
	if map_list_container == null:
		return

	for child in map_list_container.get_children():
		child.queue_free()

	# 1. Render default maps
	for m_info in default_maps:
		var btn: Button = Button.new()
		btn.text = "✦ %s (by %s)" % [m_info.get("name", "Realm"), m_info.get("author", "Unknown")]
		btn.custom_minimum_size = Vector2(0, 38)
		var target_path: String = str(m_info.get("path", "main_city"))
		btn.pressed.connect(func(): _load_community_map(target_path))
		map_list_container.add_child(btn)

	# 2. Render published maps dari database Web Studio
	if not published_maps.is_empty():
		var sep: HSeparator = HSeparator.new()
		map_list_container.add_child(sep)

		for pub in published_maps:
			var map_id: String = str(pub.get("map_id", pub.get("id", "")))
			var db_id: String = str(pub.get("id", ""))
			var map_name: String = str(pub.get("map_name", "Web Realm"))
			var author: String = str(pub.get("author", "Creator"))
			var cached_path: String = LOCAL_MAPS_DIR + map_id + ".json"

			var row_box: HBoxContainer = HBoxContainer.new()
			row_box.custom_minimum_size = Vector2(0, 38)

			var btn: Button = Button.new()
			btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			btn.text = "⚡ %s (by %s)" % [map_name, author]

			# Cek apakah sudah ada di cache lokal
			var is_cached: bool = FileAccess.file_exists(cached_path)
			if is_cached:
				btn.text += " [Cache Tersedia]"
				btn.pressed.connect(func(): _load_community_map(cached_path))
			else:
				btn.text += " [Unduh & Masuk]"
				btn.pressed.connect(func(): _download_and_enter_map(db_id, map_id))

			row_box.add_child(btn)
			map_list_container.add_child(row_box)

func _download_and_enter_map(db_id: String, map_id: String) -> void:
	if _http_download_request == null:
		return
	_current_downloading_id = map_id
	if title_label != null:
		title_label.text = "Mengunduh Realm '%s'..." % map_id

	var url: String = API_SERVER_URL + "/api/maps/public/" + db_id
	var err: Error = _http_download_request.request(url)
	if err != OK:
		if title_label != null:
			title_label.text = "Gagal mengunduh Realm dari server."

func _on_download_request_completed(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var target_path: String = LOCAL_MAPS_DIR + _current_downloading_id + ".json"
		var file: FileAccess = FileAccess.open(target_path, FileAccess.WRITE)
		if file != null:
			file.store_buffer(body)
			file.close()
			_load_community_map(target_path)
			return

	if title_label != null:
		title_label.text = "Gagal memproses data map dari server."

func _load_community_map(map_path: String) -> void:
	visible = false
	if EventBus != null:
		EventBus.map_load_requested.emit(map_path)

func _on_close_pressed() -> void:
	visible = false
