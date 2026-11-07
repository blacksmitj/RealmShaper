class_name ArmorData
extends Resource
## Definisi Spesifikasi Kosmetik & Stat Armor (Chest / Helmet).

enum ArmorSlot {
	CHEST,
	HELMET,
	LEGS
}

@export var armor_id: String = "iron_plate"
@export var armor_name: String = "Iron Plate Armor"
@export var slot: ArmorSlot = ArmorSlot.CHEST
@export var defense_bonus: int = 15
@export var max_hp_bonus: int = 50
@export var move_speed_bonus: float = 0.0
@export var character_model_index: int = 0
@export var primary_color: Color = Color(0.7, 0.72, 0.78)
@export var trim_color: Color = Color(0.85, 0.7, 0.2) # Aksen emas
