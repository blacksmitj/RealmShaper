@warning_ignore("unused_signal")
extends Node
## EventBus Autoload
## Menyediakan sinyal global terdesentralisasi antar-sistem 3D & UI tanpa tight-coupling.

# Sinyal Input & Kontrol Mobile / Keyboard
signal joystick_moved(input_vector: Vector2)
signal joystick_released()
signal move_target_requested(target_world_position: Vector3)
signal move_target_cancelled()
signal attack_button_pressed()
signal dash_button_pressed()
signal skill_button_pressed(skill_index: int)
signal weapon_swap_requested()
signal armor_swap_requested()
signal stats_modal_toggled()

# Sinyal Kamera Mobile
signal camera_orbit_dragged(relative_motion: Vector2)
signal camera_zoom_requested(zoom_delta: float)

# Sinyal Gameplay & Entity 3D
signal player_spawned(player_node: Node3D)
signal player_position_changed(new_position: Vector3)
signal player_attack_performed(weapon_name: String)
signal player_armor_changed(armor_name: String)
signal monster_defeated(exp_reward: int, monster_name: String)
signal player_leveled_up(new_level: int, unspent_points: int)

# Sinyal World & Map PGC
signal portal_triggered(target_map_id: String)
signal map_load_requested(map_id_or_path: String)
signal map_loaded(map_id: String)
