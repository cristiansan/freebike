// js/physics.js

// Este archivo contiene un modelo físico simplificado para estimar la velocidad
// del ciclismo a partir de la potencia, útil para entrenamientos en interiores.

// --- Parámetros del Modelo Físico (ajustables) ---
// Estos valores son estimaciones estándar para un ciclista aficionado.
const RIDER_MASS_KG = 75; // Masa del ciclista en kg
const BIKE_MASS_KG = 9;   // Masa de la bicicleta en kg
const TOTAL_MASS = RIDER_MASS_KG + BIKE_MASS_KG;

const GRAVITY = 9.8067; // Aceleración gravitacional en m/s^2

// Coeficiente de resistencia a la rodadura (Crr)
// Depende de las llantas y la superficie. 0.004 es un valor para llantas de carretera de buena calidad.
const ROLLING_RESISTANCE_COEFF = 0.004;

// Densidad del aire (rho) en kg/m^3
// Varía con la altitud y la temperatura. 1.225 es el valor estándar a nivel del mar.
const AIR_DENSITY_KG_M3 = 1.225;

// Coeficiente de arrastre aerodinámico (CdA) en m^2
// Es el factor más importante a altas velocidades. Depende de la posición del ciclista.
// 0.32 es una buena estimación para una posición sobre los "hoods".
const DRAG_COEFF_AERO_M2 = 0.32;

// Eficiencia de la transmisión (cadena, engranajes, etc.)
// Generalmente se pierde un pequeño porcentaje de potencia.
const DRIVETRAIN_EFFICIENCY = 0.975; // 2.5% de pérdida

/**
 * Estima la velocidad de ciclismo en una superficie plana a partir de la potencia.
 * Utiliza un solucionador iterativo basado en un modelo físico estándar.
 * La fórmula es: Potencia = Potencia_rodadura + Potencia_aerodinámica
 * P = (Crr * m * g * v) + (0.5 * CdA * rho * v^3)
 * 
 * @param {number} powerInWatts - La potencia medida en el potenciómetro (en vatios).
 * @returns {number} La velocidad estimada en metros por segundo (m/s).
 */
export function calculateSpeedFromPower(powerInWatts) {
    if (powerInWatts <= 0) return 0;

    const powerAtWheel = powerInWatts * DRIVETRAIN_EFFICIENCY;

    // Coeficientes para la ecuación cúbica: a*v^3 + b*v - P = 0
    const a = 0.5 * DRAG_COEFF_AERO_M2 * AIR_DENSITY_KG_M3; // Coeficiente de v^3 (aerodinámica)
    const b = ROLLING_RESISTANCE_COEFF * TOTAL_MASS * GRAVITY;   // Coeficiente de v (rodadura)

    // Usamos una búsqueda binaria para encontrar la velocidad (v). Es un método robusto y eficiente.
    let low = 0;    // Límite inferior de velocidad (m/s)
    let high = 30;  // Límite superior razonable (108 km/h)
    let mid, calculatedPower;

    // 20 iteraciones son más que suficientes para obtener una alta precisión.
    for (let i = 0; i < 20; i++) {
        mid = (low + high) / 2;
        // Calcula la potencia necesaria para mantener la velocidad 'mid'
        calculatedPower = (a * mid * mid * mid) + (b * mid);
        
        if (calculatedPower > powerAtWheel) {
            high = mid; // La potencia calculada es demasiado alta, reduce el límite superior
        } else {
            low = mid;  // La potencia calculada es demasiado baja, aumenta el límite inferior
        }
    }

    return (low + high) / 2; // Devuelve la velocidad estimada en m/s
} 