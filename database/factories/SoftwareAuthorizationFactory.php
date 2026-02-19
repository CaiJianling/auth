<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SoftwareAuthorization>
 */
class SoftwareAuthorizationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'software_name' => fake()->company() . ' 软件',
            'software_version' => fake()->numerify('##.##.##'),
            'os_version' => fake()->randomElement(['Windows 11', 'Windows 10', 'macOS 14', 'Ubuntu 22.04']),
            'bios_uuid' => fake()->uuid(),
            'motherboard_serial' => fake()->regexify('[A-Z0-9]{10}'),
            'cpu_id' => fake()->regexify('[A-Z0-9]{12}'),
            'request_ip' => fake()->ipv4(),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the authorization is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the authorization is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'authorized_at' => now(),
        ]);
    }

    /**
     * Indicate that the authorization is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
