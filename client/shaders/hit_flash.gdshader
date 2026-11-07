shader_type canvas_item;

// Uniform untuk mengontrol intensitas flash putih saat terkena damage
uniform float hit_flash_intensity : hint_range(0.0, 1.0) = 0.0;
uniform vec4 hit_flash_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);

void fragment() {
	vec4 tex_color = texture(TEXTURE, UV);
	// Campur warna asli dengan warna flash putih murni berdasarkan siluet alpha
	vec3 flashed_rgb = mix(tex_color.rgb, hit_flash_color.rgb, hit_flash_intensity);
	COLOR = vec4(flashed_rgb, tex_color.a);
}

