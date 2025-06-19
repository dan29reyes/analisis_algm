#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>

#define V 81
#define N 9

bool isSafe(int v, int graph[V][V], int color[], int c) {
    for (int i = 0; i < V; i++) {
        if (graph[v][i] && color[i] == c) return false;
    }
    return true;
}

bool graphColoringUtil(int graph[V][V], int m, int color[], int v, bool fixed[]) {
    if (v == V) return true;

    if (fixed[v]) return graphColoringUtil(graph, m, color, v + 1, fixed);

    for (int c = 1; c <= m; c++) {
        if (isSafe(v, graph, color, c)) {
            color[v] = c;
            if (graphColoringUtil(graph, m, color, v + 1, fixed)) return true;
            color[v] = 0;
        }
    }
    return false;
}

bool graphColoring(int graph[V][V], int m, int color[]) {
    bool fixed[V] = {false};
    for (int i = 0; i < V; i++) {
        if (color[i] != 0) fixed[i] = true;
    }

    clock_t start = clock();
    bool result = graphColoringUtil(graph, m, color, 0, fixed);
    clock_t end = clock();
    double time_spent = (double)(end - start) / CLOCKS_PER_SEC;

    if (result) {
        printf("Sudoku resuelto:\n");
        for (int i = 0; i < V; i++) {
            printf("%d", color[i]);
            if ((i + 1) % N == 0) printf("\n");
            else printf(" ");
        }
    } else {
        printf("No se pudo resolver el Sudoku.\n");
    }

    printf("Tiempo de resolución: %.6f segundos\n", time_spent);
    return result;
}

int main() {
    int color[V];       // Estado inicial del Sudoku
    int graph[V][V];    // Matriz de adyacencia

    // Leer el Sudoku 
    for (int i = 0; i < V; i++) {
        if (scanf("%d", &color[i]) != 1) {
            fprintf(stderr, "Error al leer sudoku.\n");
            return 1;
        }
    }

    // Leer la matriz de adyacencia (81x81)
    for (int i = 0; i < V; i++) {
        for (int j = 0; j < V; j++) {
            if (scanf("%d", &graph[i][j]) != 1) {
                fprintf(stderr, "Error al leer matriz de adyacencia.\n");
                return 1;
            }
        }
    }

    graphColoring(graph, 9, color);

    return 0;
}
