<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AuthorizationCodeFactory extends Factory
{
    protected $model = \App\Models\AuthorizationCode::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'code' => \App\Models\AuthorizationCode::generateCode(),
            'notes' => $this->faker->optional()->sentence(),
            'start_time' => null,
            'end_time' => null,
            'is_active' => true,
            'used_count' => 0,
            'last_used_at' => null,
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

    public function withTimeRange(\Carbon\Carbon $start, \Carbon\Carbon $end): self
    {
        return $this->state(fn (array $attributes) => [
            'start_time' => $start,
            'end_time' => $end,
        ]);
    }

    public function permanent(): self
    {
        return $this->state(fn (array $attributes) => [
            'start_time' => null,
            'end_time' => null,
        ]);
    }
}
