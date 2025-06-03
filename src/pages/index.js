import FadeInWhenVisible from "@/components/AnimatedComponent";
import { Gitlab } from "lucide-react";

export default function Home() {
  const users = [
    { name: "Kenneth Reyes", gitUrl: "dan29reyes" },
    { name: "Abraham Reyes", gitUrl: "AbrahamReyes08" },
    { name: "Lia Ramirez", gitUrl: "Liaf21" },
  ];

  const projects = [
    {
      name: "Problema Hamiltoniano",
      description:
        "Este proyecto implementa un algoritmo para resolver el problema Hamiltoniano, que busca encontrar un ciclo que visite cada vértice de un grafo exactamente una vez.",
      url: "Hamiltonian",
    },
    {
      name: "Coloración de Grafos",
      description:
        "Este proyecto implementa un algoritmo para resolver el problema de coloración de grafos, que busca asignar colores a los vértices de un grafo de manera que no haya dos vértices adyacentes del mismo color.",
      url: "GraphColoring",
    },
    {
      name: "Problema del Subconjunto",
      description:
        "Este proyecto implementa un algoritmo para resolver el problema del subconjunto, que busca determinar si existe un subconjunto de un conjunto dado que sume a un valor específico.",
      url: "SubsetSum",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-20 min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="flex flex-col items-center gap-2">
        <FadeInWhenVisible delay={0.1}>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
            Bienvenido al proyecto de <br />
            Análisis de Algoritmos
          </h1>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.2}>
          <p className="text-base text-center">
            Este proyecto está diseñado para analizar y comparar el rendimiento
            de diferentes algoritmos de ordenamiento. <br />
            Explora los resultados de las pruebas y ve cómo se comportan los
            algoritmos en diferentes escenarios.
          </p>
        </FadeInWhenVisible>
        <div className="flex justify-center gap-4 mt-6">
          {projects.map((project, index) => (
            <FadeInWhenVisible key={index} delay={0.3 + index * 0.1}>
              <div className="col-span-1 flex flex-col justify-between max-w-md w-full bg-gray-800 p-4 rounded-lg shadow-lg mt-4 hover:scale-105 transition-transform duration-300 h-full">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="text-gray-400 mt-2">{project.description}</p>
                </div>
                <a
                  href={`/${project.url}`}
                  className="text-blue-400 hover:underline mt-auto inline-block"
                >
                  Ver Proyecto
                </a>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center pt-8 sm:pt-14">
        {users.map((user) => (
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 animate-bounce"
            href={`https://github.com/${user.gitUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Gitlab className="size-4 text-gray-400" />
            {user.name}
          </a>
        ))}
      </footer>
    </div>
  );
}
