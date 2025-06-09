#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define V 9 

bool isSafe(int v, int graph[V][V], int color[], int c) {
    for (int i = 0; i < V; i++) {
        if (graph[v][i] && c == color[i]) {
            return false;
        }
    }
    return true;
}

// Recursive function to solve the graph coloring problem
bool graphColoringUtil(int graph[V][V], int m, int color[], int v) {
    // Base case: If all vertices are colored
    if (v == V) {
        return true;
    }

    // Try different colors for the current vertex
    for (int c = 1; c <= m; c++) {
        if (isSafe(v, graph, color, c)) {
            color[v] = c; // Assign color c to vertex v
            if (graphColoringUtil(graph, m, color, v + 1)) { // Recur for the next vertex
                return true; // Solution found
            }
            color[v] = 0; // Backtrack if the current color doesn't lead to a solution
        }
    }
    return false; // No color could be assigned to vertex v
}

// Main function to solve the graph coloring problem
bool graphColoring(int graph[V][V], int m) {
    int* color = (int*)malloc(V * sizeof(int));
    for (int i = 0; i < V; i++) {
        color[i] = 0; // Initialize all colors to 0
    }

    if (graphColoringUtil(graph, m, color, 0)) {
        printf("Graph can be colored with %d colors.\n", m);
        printf("Colors assigned to vertices: ");
        for (int i = 0; i < V; i++) {
            printf("%d ", color[i]);
        }
        printf("\n");
        free(color);
        return true;
    }
    
    printf("Graph cannot be colored with %d colors.\n", m);
    free(color);
    return false;
}

int main() {
    int graph[V][V];
    int m=9 ;

    for (int i = 0; i < V; i++) {
        for (int j = 0; j < V; j++) {
            scanf("%d", &graph[i][j]);
        }
    }

    graphColoring(graph, m);

    return 0;
}