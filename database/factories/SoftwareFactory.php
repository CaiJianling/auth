<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SoftwareFactory extends Factory
{
    protected $model = \App\Models\Software::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->company(),
            'latest_version' => $this->faker->semver(),
            'download_url' => $this->faker->url(),
            'is_active' => true,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    public function active(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
