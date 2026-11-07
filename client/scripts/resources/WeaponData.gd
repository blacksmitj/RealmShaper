class_name WeaponData
extends Resource
## Definisi Spesifikasi Senjata (Weapon Item).

enum WeaponCategory {
	GREATSWORD,
	DAGGER,
	BOW,
	STAFF
}

@export var weapon_id: String = "iron_sword"
@export var weapon_name: String = "Iron Sword"
@export var category: WeaponCategory = WeaponCategory.GREATSWORD
@export var attack_type: String = "PHYSICAL" # "PHYSICAL" / "MAGIC"
@export var base_attack_bonus: int = 12
@export var attack_range: float = 2.0
@export var attack_cooldown: float = 0.6
@export var hitbox_shape_radius: float = 1.2
@export var blade_color: Color = Color(0.85, 0.85, 0.9)
@export var hilt_color: Color = Color(0.4, 0.25, 0.15)
@export var model_path: String = "res://assets/models/adventurers/sword_2handed_color.gltf"
@export var offhand_model_path: String = ""
@export var attack_anim_name: String = "2H_Melee_Attack_Chop"
