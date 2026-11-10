class_name DungeonEnvironmentBuilder3D
extends Node3D
## Membangun Arena Gothic Sanctuary 3D dan mendukung Runtime PGC 3D Map Loader dari JSON
## menggunakan MultiMeshInstance3D dengan material dinamis & voxel bertekstur/berwarna presisi.

const DUNGEON_TEX_PATH: String = "res://assets/models/dungeon/dungeon_texture.png"
const DUMMY_MONSTER_SCENE: PackedScene = preload("res://scenes/entities/DummyMonster3D.tscn")

# Palet warna deterministik sesuai Web Studio:
# 1: Fortress Stone, 2: Cobblestone, 3: Dirt, 4: Crimson Carpet, 5: Mossy Stone, 6: Lush Grass, 7: Water, 8: Timber Wood
const MATERIAL_PALETTE: Dictionary = {
	1: Color(0.18, 0.22, 0.28), # Fortress Border Stone
	2: Color(0.32, 0.35, 0.40), # Cobblestone
	3: Color(0.42, 0.30, 0.20), # Dirt Pathway
	4: Color(0.55, 0.12, 0.16), # Royal Crimson Carpet
	5: Color(0.24, 0.32, 0.24), # Mossy Ancient Ruins
	6: Color(0.18, 0.52, 0.24), # Lush Grass Meadow (Hijau subur)
	7: Color(0.15, 0.42, 0.65), # River Water
	8: Color(0.38, 0.24, 0.14)  # Timber Wood Deck
}

var _dynamic_content_root: Node3D = null
var _is_pgc_loaded: bool = false
var _sanctuary_csg_nodes: Array[Node] = []

func _ready() -> void:
	_dynamic_content_root = Node3D.new()
	_dynamic_content_root.name = "DynamicContentRoot"
	add_child(_dynamic_content_root)

	# Simpan referensi CSG node bawaan sanctuary untuk di-toggle visibilitas & collision-nya
	for child in get_children():
		if child != _dynamic_content_root and child is CollisionObject3D or child is CSGShape3D:
			_sanctuary_csg_nodes.append(child)

	if EventBus != null:
		EventBus.map_load_requested.connect(_on_map_load_requested)

	_build_default_sanctuary()

func _on_map_load_requested(map_path_or_id: String) -> void:
	if map_path_or_id.is_empty() or map_path_or_id == "main_city":
		_build_default_sanctuary()
	elif map_path_or_id.ends_with(".json") or map_path_or_id.begins_with("user://") or map_path_or_id.begins_with("res://") or ResourceLoader.exists(map_path_or_id):
		_load_pgc_json_map(map_path_or_id)

func _clear_dynamic_content() -> void:
	if _dynamic_content_root != null:
		for child in _dynamic_content_root.get_children():
			child.queue_free()

func _toggle_sanctuary_nodes(is_active: bool) -> void:
	for node in _sanctuary_csg_nodes:
		if is_instance_valid(node):
			node.visible = is_active
			if node is CSGShape3D:
				node.use_collision = is_active
			elif node is CollisionObject3D:
				node.set_process_mode(PROCESS_MODE_INHERIT if is_active else PROCESS_MODE_DISABLED)

func _build_default_sanctuary() -> void:
	_clear_dynamic_content()
	_is_pgc_loaded = false
	_toggle_sanctuary_nodes(true)

	_setup_torch_lights(_dynamic_content_root)
	_decorate_with_gltf_props(_dynamic_content_root)

	# Portal PGC di altar sanctuary
	var portal: MapPortal = MapPortal.new()
	portal.target_map_id = "res://assets/data/maps/community_dungeon_01.json"
	portal.portal_label = "Realm Gate (PGC Catacombs)"
	portal.position = Vector3(0.0, 1.0, -10.5)
	_dynamic_content_root.add_child(portal)

	if EventBus != null:
		EventBus.map_loaded.emit("main_city")

func _get_material(mat_id: int, roughness: float = 0.85) -> StandardMaterial3D:
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	var base_col: Color = MATERIAL_PALETTE.get(mat_id, Color(0.24, 0.28, 0.32))
	mat.albedo_color = base_col
	mat.roughness = roughness
	if mat_id == 7: # Water
		mat.roughness = 0.15
		mat.metallic = 0.2
	elif mat_id == 8: # Wood
		mat.roughness = 0.7
	return mat

func _load_pgc_json_map(json_path: String) -> void:
	if not FileAccess.file_exists(json_path):
		return

	var file: FileAccess = FileAccess.open(json_path, FileAccess.READ)
	if file == null:
		return

	var json_str: String = file.get_as_text()
	var json: JSON = JSON.new()
	if json.parse(json_str) != OK:
		return

	var map_data: Dictionary = json.data
	_clear_dynamic_content()
	_is_pgc_loaded = true

	# Sembunyikan dan nonaktifkan node altar sanctuary bawaan agar map PGC bersih murni
	_toggle_sanctuary_nodes(false)

	var width: int = int(map_data.get("width", 20))
	var height: int = int(map_data.get("height", 20))
	var layers: Dictionary = map_data.get("layers", {})
	var ground_layer: Array = layers.get("ground", [])
	var collision_layer: Array = layers.get("collision", [])
	var wall_materials_layer: Array = layers.get("wall_materials", [])

	var origin_x: float = -(width * 2.0) * 0.5 + 1.0
	var origin_z: float = -(height * 2.0) * 0.5 + 1.0

	var static_body: StaticBody3D = StaticBody3D.new()
	static_body.collision_layer = 1
	_dynamic_content_root.add_child(static_body)

	# 1. Kelompokkan MultiMesh Lantai berdasarkan Material ID agar warnanya sesuai Web Studio
	var floor_groups: Dictionary = {} # mat_id -> Array of Vector3 positions
	for y in range(height):
		for x in range(width):
			var idx: int = y * width + x
			var mat_id: int = 6 # Default Lush Grass Meadow
			if idx < ground_layer.size():
				mat_id = int(ground_layer[idx])
			if not floor_groups.has(mat_id):
				floor_groups[mat_id] = []
			var pos: Vector3 = Vector3(origin_x + (x * 2.0), -0.2, origin_z + (y * 2.0))
			floor_groups[mat_id].append(pos)

	for m_id: int in floor_groups.keys():
		var pos_list: Array = floor_groups[m_id]
		if pos_list.is_empty():
			continue
		var f_mesh_inst: MultiMeshInstance3D = MultiMeshInstance3D.new()
		var f_mm: MultiMesh = MultiMesh.new()
		f_mm.transform_format = MultiMesh.TRANSFORM_3D
		f_mm.instance_count = pos_list.size()

		var f_box: BoxMesh = BoxMesh.new()
		f_box.size = Vector3(2.0, 0.4, 2.0)
		f_box.material = _get_material(m_id, 0.85)
		f_mm.mesh = f_box

		for i in range(pos_list.size()):
			var p: Vector3 = pos_list[i]
			f_mm.set_instance_transform(i, Transform3D(Basis(), p))

		f_mesh_inst.multimesh = f_mm
		_dynamic_content_root.add_child(f_mesh_inst)

	# 2. Kelompokkan MultiMesh Dinding 2D (collision layer)
	var wall_groups: Dictionary = {}
	for y in range(height):
		for x in range(width):
			var idx: int = y * width + x
			if idx < collision_layer.size() and int(collision_layer[idx]) > 0:
				var w_mat_id: int = 5 # Default Mossy Ruins
				if idx < wall_materials_layer.size():
					w_mat_id = int(wall_materials_layer[idx])
				if not wall_groups.has(w_mat_id):
					wall_groups[w_mat_id] = []
				var pos_w: Vector3 = Vector3(origin_x + (x * 2.0), 1.75, origin_z + (y * 2.0))
				wall_groups[w_mat_id].append(pos_w)

				# Collision shape dinding
				var c_shape: CollisionShape3D = CollisionShape3D.new()
				var box_shape: BoxShape3D = BoxShape3D.new()
				box_shape.size = Vector3(2.0, 3.5, 2.0)
				c_shape.shape = box_shape
				c_shape.position = pos_w
				static_body.add_child(c_shape)

	for wm_id: int in wall_groups.keys():
		var w_list: Array = wall_groups[wm_id]
		if w_list.is_empty():
			continue
		var w_mesh_inst: MultiMeshInstance3D = MultiMeshInstance3D.new()
		var w_mm: MultiMesh = MultiMesh.new()
		w_mm.transform_format = MultiMesh.TRANSFORM_3D
		w_mm.instance_count = w_list.size()

		var w_box: BoxMesh = BoxMesh.new()
		w_box.size = Vector3(2.0, 3.5, 2.0)
		w_box.material = _get_material(wm_id, 0.65)
		w_mm.mesh = w_box

		for i in range(w_list.size()):
			var pw: Vector3 = w_list[i]
			w_mm.set_instance_transform(i, Transform3D(Basis(), pw))

		w_mesh_inst.multimesh = w_mm
		_dynamic_content_root.add_child(w_mesh_inst)

	# 3. Dukungan Voxel Blocks 3D (hingga 20 tile ke atas)
	var voxel_blocks: Array = map_data.get("voxel_blocks", [])
	if not voxel_blocks.is_empty():
		for vb in voxel_blocks:
			var vb_dict := vb as Dictionary
			var bx: float = origin_x + (float(vb_dict.get("x", 0)) * 2.0)
			var by: float = (float(vb_dict.get("y", 0)) * 1.15) + 0.575
			var bz: float = origin_z + (float(vb_dict.get("z", 0)) * 2.0)
			var rot_y: float = deg_to_rad(float(vb_dict.get("rotation_y", 0.0)))
			var v_mat_id: int = int(vb_dict.get("material_id", 5))

			var block_mesh: MeshInstance3D = MeshInstance3D.new()
			var box_m: BoxMesh = BoxMesh.new()
			box_m.size = Vector3(1.96, 1.12, 1.96)
			box_m.material = _get_material(v_mat_id, 0.65)
			block_mesh.mesh = box_m
			block_mesh.position = Vector3(bx, by, bz)
			block_mesh.rotation = Vector3(0.0, rot_y, 0.0)
			_dynamic_content_root.add_child(block_mesh)

			var c_shape: CollisionShape3D = CollisionShape3D.new()
			var box_shape: BoxShape3D = BoxShape3D.new()
			box_shape.size = Vector3(1.96, 1.12, 1.96)
			c_shape.shape = box_shape
			c_shape.position = Vector3(bx, by, bz)
			static_body.add_child(c_shape)

	# 4. Lantai dasar fisik (agar raycast tap-to-move selalu mendeteksi tanah)
	var floor_c_shape: CollisionShape3D = CollisionShape3D.new()
	var ground_box: BoxShape3D = BoxShape3D.new()
	ground_box.size = Vector3(width * 2.0, 0.4, height * 2.0)
	floor_c_shape.shape = ground_box
	floor_c_shape.position = Vector3(0.0, -0.2, 0.0)
	static_body.add_child(floor_c_shape)

	# 5. Spawn monster PGC
	var spawners: Array = map_data.get("spawners", [])
	var m_variant: int = 0
	for sp in spawners:
		var sp_dict := sp as Dictionary
		var gx: float = float(sp_dict.get("x", 8.0))
		var gy: float = float(sp_dict.get("y", 8.0))
		var m_pos: Vector3 = Vector3(origin_x + (gx * 2.0), 0.0, origin_z + (gy * 2.0))
		var m_inst: DummyMonster3D = DUMMY_MONSTER_SCENE.instantiate() as DummyMonster3D
		if m_inst != null:
			m_inst.position = m_pos
			m_inst.monster_name = "Catacomb Stalker"
			m_inst.monster_variant = m_variant
			m_variant = (m_variant + 1) % 4
			_dynamic_content_root.add_child(m_inst)

	# 6. Spawn Portal Return to Sanctuary
	var return_portal: MapPortal = MapPortal.new()
	return_portal.target_map_id = "main_city"
	return_portal.portal_label = "Return to Sanctuary"
	return_portal.position = Vector3(0.0, 1.0, origin_z + 2.0)
	_dynamic_content_root.add_child(return_portal)

	# Tempatkan pemain di titik aman (tengah map)
	var player: Node3D = get_tree().root.find_child("Player3D", true, false) as Node3D
	if player != null:
		player.global_position = Vector3(0.0, 0.2, origin_z + 5.0)

	if EventBus != null:
		EventBus.map_loaded.emit(str(map_data.get("map_id", "pgc_dungeon")))

func _setup_torch_lights(parent: Node) -> void:
	var torch_positions: Array[Vector3] = [
		Vector3(-4.5, 3.2, -11.0),
		Vector3(4.5, 3.2, -11.0),
		Vector3(-6.5, 2.2, -3.5),
		Vector3(6.5, 2.2, -3.5)
	]

	var wood_mat: StandardMaterial3D = StandardMaterial3D.new()
	wood_mat.albedo_color = Color(0.35, 0.22, 0.12)

	var flame_mat: StandardMaterial3D = StandardMaterial3D.new()
	flame_mat.albedo_color = Color(1.0, 0.65, 0.15)
	flame_mat.emission_enabled = true
	flame_mat.emission = Color(1.0, 0.45, 0.1)
	flame_mat.emission_energy_multiplier = 3.5

	for pos: Vector3 in torch_positions:
		var mount: CSGBox3D = CSGBox3D.new()
		mount.size = Vector3(0.18, 0.6, 0.18)
		mount.position = pos
		mount.material = wood_mat
		parent.add_child(mount)

		var flame: CSGBox3D = CSGBox3D.new()
		flame.size = Vector3(0.12, 0.2, 0.12)
		flame.position = pos + Vector3(0, 0.35, 0)
		flame.material = flame_mat
		parent.add_child(flame)

		var light: OmniLight3D = OmniLight3D.new()
		light.position = pos + Vector3(0, 0.45, 0)
		light.light_color = Color(1.0, 0.75, 0.35)
		light.light_energy = 1.8
		light.omni_range = 8.5
		light.shadow_enabled = false
		parent.add_child(light)

func _decorate_with_gltf_props(parent: Node) -> void:
	_spawn_prop_or_fallback("res://assets/models/dungeon/chest_gold.glb", Vector3(-3.8, 1.0, -9.5), Vector3(0.0, deg_to_rad(25.0), 0.0), parent)
	_spawn_prop_or_fallback("res://assets/models/dungeon/chest.glb", Vector3(3.8, 1.0, -9.5), Vector3(0.0, deg_to_rad(-25.0), 0.0), parent)
	_build_castle_walls(parent)

func _spawn_prop_or_fallback(path: String, pos: Vector3, rot: Vector3, parent: Node) -> void:
	if ResourceLoader.exists(path):
		var scene: PackedScene = load(path) as PackedScene
		if scene != null:
			var inst: Node3D = scene.instantiate() as Node3D
			if inst != null:
				inst.position = pos
				inst.rotation = rot
				parent.add_child(inst)
				return

	var fallback_box: CSGBox3D = CSGBox3D.new()
	fallback_box.size = Vector3(0.8, 0.8, 0.8)
	fallback_box.position = pos
	fallback_box.rotation = rot
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.55, 0.42, 0.22)
	fallback_box.material = mat
	parent.add_child(fallback_box)

func _build_castle_walls(parent: Node) -> void:
	var stone_wall_mat: StandardMaterial3D = StandardMaterial3D.new()
	stone_wall_mat.albedo_color = Color(0.28, 0.27, 0.32)
	stone_wall_mat.roughness = 0.85

	var trim_gold_mat: StandardMaterial3D = StandardMaterial3D.new()
	trim_gold_mat.albedo_color = Color(0.65, 0.52, 0.24)
	trim_gold_mat.metallic = 0.5
	trim_gold_mat.roughness = 0.4

	var back_wall: CSGBox3D = CSGBox3D.new()
	back_wall.size = Vector3(16.0, 4.5, 1.2)
	back_wall.position = Vector3(0.0, 2.25, -13.5)
	back_wall.use_collision = true
	back_wall.material = stone_wall_mat
	parent.add_child(back_wall)

	for z_pos: float in [-8.0, -2.0, 4.0, 10.0]:
		for side: float in [-1.0, 1.0]:
			var col_base: CSGBox3D = CSGBox3D.new()
			col_base.size = Vector3(1.4, 0.6, 1.4)
			col_base.position = Vector3(side * 8.5, 0.3, z_pos)
			col_base.use_collision = true
			col_base.material = trim_gold_mat
			parent.add_child(col_base)

			var col_shaft: CSGCylinder3D = CSGCylinder3D.new()
			col_shaft.radius = 0.55
			col_shaft.height = 4.2
			col_shaft.sides = 12
			col_shaft.position = Vector3(side * 8.5, 2.6, z_pos)
			col_shaft.use_collision = true
			col_shaft.material = stone_wall_mat
			parent.add_child(col_shaft)
