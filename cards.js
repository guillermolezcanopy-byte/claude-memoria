/* Fuego Cruzado — mazo de desafíos para parejas (+18)
 * Niveles de picante:
 *   1 = Suave    (juego previo, romántico, ropa puesta)
 *   2 = Caliente (sube la temperatura, algo de ropa de menos)
 *   3 = Picante  (acción explícita)
 *   4 = Infierno (lo más intenso del mazo)
 */

const LEVELS = {
  1: { name: "Suave",    emoji: "😌", desc: "Romántico y juguetón, para arrancar", color: "#e8896b" },
  2: { name: "Caliente", emoji: "😏", desc: "Sube la temperatura de a poco",       color: "#ff7a59" },
  3: { name: "Picante",  emoji: "🌶️", desc: "Sin vueltas, directo al fuego",        color: "#ff2d55" },
  4: { name: "Infierno", emoji: "🔥", desc: "Lo más intenso del mazo",              color: "#b1001f" },
};

const CARDS = [
  // ---------- Nivel 1 · Suave ----------
  { lvl: 1, text: "Mirá a tu pareja a los ojos durante 30 segundos sin hablar ni reírte. El que afloja primero, cumple el próximo desafío." },
  { lvl: 1, text: "Susurrale al oído tres cosas que te encantan de su cuerpo." },
  { lvl: 1, text: "Dale un masaje lento en los hombros y el cuello durante 2 minutos." },
  { lvl: 1, text: "Besá a tu pareja en tres lugares que no sean la boca." },
  { lvl: 1, text: "Contale cuál fue el momento en que más ganas le tuviste." },
  { lvl: 1, text: "Bailá una canción lenta bien pegados, sin importar que no haya música." },
  { lvl: 1, text: "Describí con detalle la fantasía más suave que tengas con tu pareja." },
  { lvl: 1, text: "Sacále una prenda a tu pareja usando solo la boca." },
  { lvl: 1, text: "Pasá un cubito de hielo por el cuello y la clavícula de tu pareja." },
  { lvl: 1, text: "Dale diez besos cortos, cada uno en un lugar distinto, y que adivine el próximo." },
  { lvl: 1, text: "Mandale ahora mismo el mensaje más provocador que te animes, aunque estén en la misma habitación." },
  { lvl: 1, text: "Elegí una parte del cuerpo de tu pareja y explicá en voz alta por qué te vuelve loco/a." },

  // ---------- Nivel 2 · Caliente ----------
  { lvl: 2, text: "Sacate una prenda. La que vos elijas." },
  { lvl: 2, text: "Besá a tu pareja en el cuello mientras le decís al oído qué le querés hacer después." },
  { lvl: 2, text: "Dale un beso de 60 segundos sin usar las manos." },
  { lvl: 2, text: "Recorré con la lengua desde el cuello hasta el ombligo de tu pareja." },
  { lvl: 2, text: "Vendale los ojos a tu pareja y hacele adivinar con qué parte de tu cuerpo la estás tocando." },
  { lvl: 2, text: "Sentate sobre tu pareja y besala como si fuera la primera vez… y la última." },
  { lvl: 2, text: "Mordé suavemente el labio, la oreja y el cuello de tu pareja, en ese orden." },
  { lvl: 2, text: "Elegí una zona prohibida del cuerpo de tu pareja y dedicale un minuto de besos." },
  { lvl: 2, text: "Quitate dos prendas, pero hacelo lento, como un show privado." },
  { lvl: 2, text: "Recostá a tu pareja y pasá tus manos por todo su cuerpo, sin tocar las zonas obvias. Todavía." },
  { lvl: 2, text: "Susurrale la cosa más atrevida que te gustaría que te haga esta noche." },
  { lvl: 2, text: "Dale un masaje con aceite (o crema) en la espalda y bajá todo lo que te animes." },
  { lvl: 2, text: "Jugá a 'caliente o frío': escondé un beso en alguna parte del cuerpo y que tu pareja lo encuentre tocándote." },

  // ---------- Nivel 3 · Picante ----------
  { lvl: 3, text: "Desnudá a tu pareja por completo, sin apuro." },
  { lvl: 3, text: "Usá solo tu boca para volver loca a tu pareja durante 2 minutos. Vos elegís dónde." },
  { lvl: 3, text: "Tu pareja te da una orden y tenés que cumplirla sin protestar." },
  { lvl: 3, text: "Recreen su posición favorita… pero solo hasta que suene el próximo turno." },
  { lvl: 3, text: "Atá (suavemente) las manos de tu pareja y tomá el control durante el próximo desafío." },
  { lvl: 3, text: "Provocá a tu pareja hasta el borde y frená justo antes. Repetí una vez más." },
  { lvl: 3, text: "Dejá que tu pareja elija una zona de tu cuerpo y la disfrute como quiera por 90 segundos." },
  { lvl: 3, text: "Hacele a tu pareja exactamente lo que más te gustaría que te hagan a vos." },
  { lvl: 3, text: "Usá las manos de tu pareja para guiarla y mostrarle cómo te gusta." },
  { lvl: 3, text: "Improvisen un striptease por turnos: una prenda cada uno hasta no quedar nada." },
  { lvl: 3, text: "Elegí un juguete o un objeto de la casa (seguro) e incorporalo al juego." },
  { lvl: 3, text: "Tu pareja se queda quieta y vos tenés vía libre durante 2 minutos. Aprovechá." },
  { lvl: 3, text: "Confesá en voz alta la fantasía más intensa que tenés… y empiecen a recrearla." },

  // ---------- Nivel 4 · Infierno ----------
  { lvl: 4, text: "Tu pareja es tu dominante absoluto durante los próximos tres desafíos. Obedecé." },
  { lvl: 4, text: "Vendá los ojos de tu pareja y sorprendela: que no sepa qué viene ni dónde." },
  { lvl: 4, text: "Elijan juntos la fantasía más prohibida que compartan y háganla realidad ahora." },
  { lvl: 4, text: "Sexo oral por turnos: 90 segundos cada uno, ida y vuelta, sin parar." },
  { lvl: 4, text: "Tomá el control total: decile a tu pareja cada cosa que tiene que hacer, paso a paso." },
  { lvl: 4, text: "Cambien de escenario: háganlo en otro lugar de la casa que nunca hayan usado." },
  { lvl: 4, text: "Provocación extrema: lleven a su pareja al borde tres veces antes de dejarla llegar." },
  { lvl: 4, text: "Reten su récord: vean cuánto pueden aguantar antes de no poder esperar más." },
  { lvl: 4, text: "Roleplay: inventen dos personajes en 30 segundos y métanse en el papel hasta el final." },
  { lvl: 4, text: "Cada uno pide UN deseo sin filtro. Los dos se cumplen, uno después del otro." },
  { lvl: 4, text: "Apaguen las luces, dejen el teléfono lejos y no paren hasta que ambos estén satisfechos. Sin cartas de por medio." },
  { lvl: 4, text: "Carta comodín del infierno: el que la levantó manda absolutamente todo durante los próximos 5 minutos." },
  { lvl: 4, text: "Edging en equipo: tu pareja decide cuándo podés llegar… y vos no tenés voz ni voto. Que sufra (rico) la espera." },
  { lvl: 4, text: "Confesión picante: decile al oído eso que siempre quisiste pedirle pero nunca te animaste. Y háganlo." },
  { lvl: 4, text: "Manos atadas, ojos vendados y a merced de tu pareja durante todo lo que dure la próxima canción que elija." },
  { lvl: 4, text: "Elijan dos cartas más del mazo al azar y cúmplanlas las dos seguidas, sin pausa entre una y otra." },
  { lvl: 4, text: "Sin manos: solo con la boca, llevá a tu pareja hasta donde aguante. Ella te dice cuándo parar… si puede hablar." },
];
