class_name CommunityPortalDialog
extends Control
## UI Modal Portal Komunitas untuk mengunduh dan berganti ke Map PGC buatan kreator secara instan.

@onready var panel: Panel = $Panel
@onready var title_label: Label = $Panel/TitleLabel
@onready var map_list_container: VBoxContainer = $Panel/ScrollContainer/MapListContainer
@onready var close_button: Button = $Panel/CloseButton

var available_maps: Array[Dictionary] = [
	{
		"id": "main_city",
		"name": "Main Sanctuary (Official Realm)",
		"author": "RealmShaper Team",
		"path": "main_city"
	},
	{
		"id": "community_dungeon_01",
		"name": "Forgotten Crypt (PGC Catacombs)",
		"author": "ShadowCrafter",
		"path": "res://assets/data/maps/community_dungeon_01.json"
	}
]

func _ready() -> void:
	visible = false
	if close_button != null:
		close_button.pressed.connect(_on_close_pressed)
	if EventBus != null:
		EventBus.portal_triggered.connect(_on_portal_triggered)
	_populate_map_list()

func _populate_map_list() -> void:
	if map_list_container == null:
		return

	for child in map_list_container.get_children():
		child.queue_free()

	for m_info in available_maps:
		var btn: Button = Button.new()
		btn.text = "%s (by %s)" % [m_info.name, m_info.author]
		btn.custom_minimum_size = Vector2(0, 36)
		var target_path: String = m_info.path
		btn.pressed.connect(func(): _load_community_map(target_path))
		map_list_container.add_child(btn)

func _on_portal_triggered(_target_id: String) -> void:
	visible = true

func _load_community_map(map_path: String) -> void:
	visible = false
	if EventBus != null:
		EventBus.map_load_requested.emit(map_path)

func _on_close_pressed() -> void:
	visible = false
