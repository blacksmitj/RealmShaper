class_name CharacterStatsModal
extends Control
## Modal Dialog untuk Melihat dan Mengalokasikan 6 Atribut Karakter (STR, AGI, VIT, INT, DEX, LUK).

@onready var close_button: Button = $Panel/CloseButton
@onready var points_label: Label = $Panel/PointsLabel
@onready var level_label: Label = $Panel/LevelLabel

# Atribut UI Labels & Buttons
@onready var str_val: Label = $Panel/Grid/STRVal
@onready var agi_val: Label = $Panel/Grid/AGIVal
@onready var vit_val: Label = $Panel/Grid/VITVal
@onready var int_val: Label = $Panel/Grid/INTVal
@onready var dex_val: Label = $Panel/Grid/DEXVal
@onready var luk_val: Label = $Panel/Grid/LUKVal

@onready var btn_str: Button = $Panel/Grid/BtnSTR
@onready var btn_agi: Button = $Panel/Grid/BtnAGI
@onready var btn_vit: Button = $Panel/Grid/BtnVIT
@onready var btn_int: Button = $Panel/Grid/BtnINT
@onready var btn_dex: Button = $Panel/Grid/BtnDEX
@onready var btn_luk: Button = $Panel/Grid/BtnLUK

# Derived Stats Labels
@onready var derived_atk: Label = $Panel/DerivedStats/AtkLabel
@onready var derived_def: Label = $Panel/DerivedStats/DefLabel
@onready var derived_crit: Label = $Panel/DerivedStats/CritLabel
@onready var derived_spd: Label = $Panel/DerivedStats/SpdLabel

var _player_stats: StatsComponent = null

func _ready() -> void:
	visible = false
	if close_button != null:
		close_button.pressed.connect(func(): visible = false)

	if EventBus != null:
		EventBus.stats_modal_toggled.connect(_on_toggle_modal)
		EventBus.player_spawned.connect(_on_player_spawned)

	_setup_buttons()

func _setup_buttons() -> void:
	if btn_str != null: btn_str.pressed.connect(func(): _allocate("STR"))
	if btn_agi != null: btn_agi.pressed.connect(func(): _allocate("AGI"))
	if btn_vit != null: btn_vit.pressed.connect(func(): _allocate("VIT"))
	if btn_int != null: btn_int.pressed.connect(func(): _allocate("INT"))
	if btn_dex != null: btn_dex.pressed.connect(func(): _allocate("DEX"))
	if btn_luk != null: btn_luk.pressed.connect(func(): _allocate("LUK"))

func _on_player_spawned(p_node: Node) -> void:
	_player_stats = p_node.get_node_or_null("StatsComponent") as StatsComponent
	if _player_stats != null:
		_player_stats.stats_changed.connect(_refresh_ui)
		_refresh_ui()

func _on_toggle_modal() -> void:
	visible = not visible
	if visible:
		_refresh_ui()

func _allocate(attr: String) -> void:
	if _player_stats != null:
		_player_stats.allocate_point(attr)
		_refresh_ui()

func _refresh_ui() -> void:
	if _player_stats == null:
		return

	if points_label != null:
		points_label.text = "Unspent Points: %d" % _player_stats.unspent_stat_points
	if level_label != null:
		level_label.text = "Character Level: %d" % _player_stats.level

	if str_val != null: str_val.text = str(_player_stats.strength)
	if agi_val != null: agi_val.text = str(_player_stats.agility)
	if vit_val != null: vit_val.text = str(_player_stats.vitality)
	if int_val != null: int_val.text = str(_player_stats.intelligence)
	if dex_val != null: dex_val.text = str(_player_stats.dexterity)
	if luk_val != null: luk_val.text = str(_player_stats.luck)

	var has_pts: bool = (_player_stats.unspent_stat_points > 0)
	if btn_str != null: btn_str.disabled = not has_pts
	if btn_agi != null: btn_agi.disabled = not has_pts
	if btn_vit != null: btn_vit.disabled = not has_pts
	if btn_int != null: btn_int.disabled = not has_pts
	if btn_dex != null: btn_dex.disabled = not has_pts
	if btn_luk != null: btn_luk.disabled = not has_pts

	if derived_atk != null:
		derived_atk.text = "P.ATK: %d | M.ATK: %d" % [_player_stats.physical_attack, _player_stats.magic_attack]
	if derived_def != null:
		derived_def.text = "DEF: %d | Max HP: %d" % [_player_stats.defense, _player_stats.max_health]
	if derived_crit != null:
		derived_crit.text = "CRIT: %.1f%% (x%.1f)" % [_player_stats.critical_chance * 100.0, _player_stats.critical_multiplier]
	if derived_spd != null:
		derived_spd.text = "MSPD: %.1f m/s | ASPD: %.2fx" % [_player_stats.movement_speed, _player_stats.attack_speed]

