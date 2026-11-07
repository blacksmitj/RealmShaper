class_name HurtboxComponent
extends Area3D
## Area 3D penerima damage. Meneruskan serangan dari HitboxComponent ke HealthComponent.

signal hit_received(hitbox: HitboxComponent, damage: int)

@export var health_component: HealthComponent
@export var defense_stat: int = 0

func _ready() -> void:
	monitoring = true
	monitorable = true
	area_entered.connect(_on_area_entered)

func _on_area_entered(area: Area3D) -> void:
	if area is HitboxComponent:
		var hitbox: HitboxComponent = area as HitboxComponent
		if hitbox.source_attacker != null and hitbox.source_attacker == owner:
			return
			
		var raw_damage: int = maxi(1, hitbox.base_damage - int(defense_stat * 0.45))
		var damage_dealt: int = raw_damage
		if health_component != null:
			damage_dealt = health_component.take_damage(raw_damage, hitbox.is_critical, hitbox.attack_type)
			
		if damage_dealt > 0:
			hit_received.emit(hitbox, damage_dealt)
			hitbox.hit_landed.emit(self, damage_dealt)
