#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <limits.h>

#define MAX_VERTICES 50
#define MAX_TOP_PATHS 10

typedef struct
{
    int *path_nodes;
    int path_length;
    double time_taken; // Usaremos esto para la distancia del camino
} PathData;

PathData top_paths[MAX_TOP_PATHS];
int current_top_paths_count = 0;

int total_paths_found_count = 0; // Contará el número de caminos válidos encontrados y agregados a top_paths
clock_t global_start_time;

void initializeTopPaths()
{
    for (int i = 0; i < MAX_TOP_PATHS; i++)
    {
        top_paths[i].path_nodes = NULL;
        top_paths[i].path_length = 0;
        top_paths[i].time_taken = -1.0;
    }
    current_top_paths_count = 0; // Resetear el contador
}

// Modificada para permitir el almacenamiento de múltiples caminos
void insertIntoTopPaths(int V, int current_path[], int current_pos, double distance)
{
    if (distance == INT_MAX)
        return; // No insertar caminos inalcanzables

    // Si aún hay espacio en top_paths
    if (current_top_paths_count < MAX_TOP_PATHS)
    {
        top_paths[current_top_paths_count].path_nodes = (int *)malloc(sizeof(int) * current_pos);
        if (top_paths[current_top_paths_count].path_nodes == NULL)
        {
            perror("Error allocating memory for path in top_paths");
            return;
        }
        memcpy(top_paths[current_top_paths_count].path_nodes, current_path, sizeof(int) * current_pos);
        top_paths[current_top_paths_count].path_length = current_pos;
        top_paths[current_top_paths_count].time_taken = distance;
        current_top_paths_count++;
    }
    else // top_paths está lleno, necesitamos reemplazar si este camino es más corto
    {
        int max_dist_idx = 0;
        for (int i = 1; i < MAX_TOP_PATHS; i++)
        {
            if (top_paths[i].time_taken > top_paths[max_dist_idx].time_taken) // Buscamos el más largo (mayor distancia)
            {
                max_dist_idx = i;
            }
        }

        if (distance < top_paths[max_dist_idx].time_taken) // Si este nuevo camino es más corto que el más largo actual
        {
            free(top_paths[max_dist_idx].path_nodes);
            top_paths[max_dist_idx].path_nodes = (int *)malloc(sizeof(int) * current_pos);
            if (top_paths[max_dist_idx].path_nodes == NULL)
            {
                perror("Error allocating memory for path replacement in top_paths");
                return;
            }
            memcpy(top_paths[max_dist_idx].path_nodes, current_path, sizeof(int) * current_pos);
            top_paths[max_dist_idx].path_length = current_pos;
            top_paths[max_dist_idx].time_taken = distance;
        }
    }
}

// Comparar por distancia (time_taken) para ordenar de menor a mayor
int comparePaths(const void *a, const void *b)
{
    PathData *pathA = (PathData *)a;
    PathData *pathB = (PathData *)b;
    if (pathA->time_taken < pathB->time_taken)
        return -1; // pathA es más corto, va antes
    if (pathA->time_taken > pathB->time_taken)
        return 1; // pathB es más corto, va antes
    return 0;     // distancias iguales
}

void outputJsonResult(int V, int start_vertex, int total_paths_found, double total_time_taken)
{
    // Ordenar los caminos por su distancia (time_taken) de menor a mayor
    qsort(top_paths, current_top_paths_count, sizeof(PathData), comparePaths);

    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"graph_vertices\": %d,\n", V);
    printf("  \"start_vertex\": %d,\n", start_vertex);
    printf("  \"total_paths_found\": %d,\n", total_paths_found);
    printf("  \"total_time_seconds\": %.6f,\n", total_time_taken);
    printf("  \"top_paths\": [\n");

    for (int i = 0; i < current_top_paths_count; i++)
    {
        printf("    {\n");
        printf("      \"name\": \"Camino a %d (Distancia %.0f)\",\n", top_paths[i].path_nodes[top_paths[i].path_length - 1], top_paths[i].time_taken);
        printf("      \"time_taken_seconds\": %.6f,\n", top_paths[i].time_taken); // Distancia del camino
        printf("      \"path_length\": %d,\n", top_paths[i].path_length);
        printf("      \"path\": [");
        for (int j = 0; j < top_paths[i].path_length; j++)
        {
            printf("%d%s", top_paths[i].path_nodes[j], (j == top_paths[i].path_length - 1) ? "" : ", ");
        }
        printf("]\n");
        printf("    }%s\n", (i == current_top_paths_count - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

void freeTopPaths()
{
    for (int i = 0; i < current_top_paths_count; i++)
    {
        free(top_paths[i].path_nodes);
        top_paths[i].path_nodes = NULL;
    }
    current_top_paths_count = 0;
}

bool **generateCompleteGraph(int V)
{
    bool **graph = (bool **)malloc(sizeof(bool *) * V);
    if (graph == NULL)
    {
        perror("Error allocating memory for main graph");
        return NULL;
    }
    for (int i = 0; i < V; i++)
    {
        graph[i] = (bool *)malloc(sizeof(bool) * V);
        if (graph[i] == NULL)
        {
            perror("Error allocating memory for graph row");
            for (int k = 0; k < i; ++k)
                free(graph[k]);
            free(graph);
            return NULL;
        }
        for (int j = 0; j < V; j++)
        {
            graph[i][j] = (i != j);
        }
    }
    return graph;
}

void freeGraph(int V, bool **graph)
{
    if (graph == NULL)
        return;
    for (int i = 0; i < V; i++)
    {
        free(graph[i]);
    }
    free(graph);
}

typedef struct MinHeapNode
{
    int vertex;
    int distance;
} MinHeapNode;

typedef struct MinHeap
{
    MinHeapNode *array;
    int capacity;
    int size;
    int *pos;
} MinHeap;

MinHeap *createMinHeap(int capacity)
{
    MinHeap *minHeap = (MinHeap *)malloc(sizeof(MinHeap));
    if (minHeap == NULL)
    {
        perror("Memory allocation failed for MinHeap");
        exit(EXIT_FAILURE);
    }
    minHeap->pos = (int *)malloc(capacity * sizeof(int));
    if (minHeap->pos == NULL)
    {
        perror("Memory allocation failed for minHeap->pos");
        free(minHeap);
        exit(EXIT_FAILURE);
    }
    minHeap->array = (MinHeapNode *)malloc(capacity * sizeof(MinHeapNode));
    if (minHeap->array == NULL)
    {
        perror("Memory allocation failed for minHeap->array");
        free(minHeap->pos);
        free(minHeap);
        exit(EXIT_FAILURE);
    }
    minHeap->capacity = capacity;
    minHeap->size = 0;
    return minHeap;
}

void swapMinHeapNode(MinHeapNode *a, MinHeapNode *b)
{
    MinHeapNode temp = *a;
    *a = *b;
    *b = temp;
}

void minHeapify(MinHeap *minHeap, int idx)
{
    int smallest = idx;
    int left = 2 * idx + 1;
    int right = 2 * idx + 2;

    if (left < minHeap->size && minHeap->array[left].distance < minHeap->array[smallest].distance)
    {
        smallest = left;
    }
    if (right < minHeap->size && minHeap->array[right].distance < minHeap->array[smallest].distance)
    {
        smallest = right;
    }

    if (smallest != idx)
    {
        MinHeapNode smallestNode = minHeap->array[smallest];
        MinHeapNode idxNode = minHeap->array[idx];

        minHeap->pos[smallestNode.vertex] = idx;
        minHeap->pos[idxNode.vertex] = smallest;

        swapMinHeapNode(&minHeap->array[smallest], &minHeap->array[idx]);
        minHeapify(minHeap, smallest);
    }
}

bool isEmpty(MinHeap *minHeap)
{
    return minHeap->size == 0;
}

MinHeapNode extractMin(MinHeap *minHeap)
{
    if (isEmpty(minHeap))
    {
        return (MinHeapNode){-1, INT_MAX};
    }

    MinHeapNode root = minHeap->array[0];
    MinHeapNode lastNode = minHeap->array[minHeap->size - 1];
    minHeap->array[0] = lastNode;

    minHeap->pos[root.vertex] = minHeap->size - 1;
    minHeap->pos[lastNode.vertex] = 0;

    minHeap->size--;
    minHeapify(minHeap, 0);

    return root;
}

void decreaseKey(MinHeap *minHeap, int vertex, int distance)
{
    int i = minHeap->pos[vertex];
    minHeap->array[i].distance = distance;

    while (i > 0 && minHeap->array[i].distance < minHeap->array[(i - 1) / 2].distance)
    {
        minHeap->pos[minHeap->array[i].vertex] = (i - 1) / 2;
        minHeap->pos[minHeap->array[(i - 1) / 2].vertex] = i;
        swapMinHeapNode(&minHeap->array[i], &minHeap->array[(i - 1) / 2]);
        i = (i - 1) / 2;
    }
}

void freeMinHeap(MinHeap *minHeap)
{
    if (minHeap == NULL)
        return;
    free(minHeap->pos);
    free(minHeap->array);
    free(minHeap);
}

// Función para reconstruir un camino dado el array de padres
void reconstructPath(int V, int parent[], int start_vertex, int end_vertex, int path_out[], int *path_len_out)
{
    if (end_vertex == start_vertex)
    { // Si el destino es el origen, el camino es solo el origen
        path_out[0] = start_vertex;
        *path_len_out = 1;
        return;
    }

    int current = end_vertex;
    int path_idx = 0;
    int temp_path_nodes[V]; // Array temporal para reconstruir el camino en orden inverso

    // Reconstruir desde el destino hacia el origen usando el array de padres
    while (current != -1 && current != start_vertex)
    {
        temp_path_nodes[path_idx++] = current;
        current = parent[current];
    }

    // Si no se llegó al start_vertex, significa que no hay camino o el start_vertex no fue un padre
    if (current == -1 && end_vertex != start_vertex)
    { // current == -1 means no path found
        *path_len_out = 0;
        return;
    }
    temp_path_nodes[path_idx++] = start_vertex; // Añadir el vértice inicial

    // Invertir el camino para que esté en el orden correcto
    *path_len_out = path_idx;
    for (int i = 0; i < path_idx; i++)
    {
        path_out[i] = temp_path_nodes[path_idx - 1 - i];
    }
}

void dijkstra_for_output(int V, bool **graph, int start_vertex)
{
    int dist[V];
    int parent[V];

    MinHeap *minHeap = createMinHeap(V);

    for (int i = 0; i < V; i++)
    {
        dist[i] = INT_MAX;
        parent[i] = -1;
        minHeap->array[i] = (MinHeapNode){.vertex = i, .distance = INT_MAX};
        minHeap->pos[i] = i;
    }

    dist[start_vertex] = 0;
    decreaseKey(minHeap, start_vertex, 0);
    minHeap->size = V;

    total_paths_found_count = 0; // Se usará para contar los caminos válidos que se insertan en top_paths

    while (!isEmpty(minHeap))
    {
        MinHeapNode extractedNode = extractMin(minHeap);
        int u = extractedNode.vertex;

        if (u == -1 || extractedNode.distance == INT_MAX)
        {
            break; // No more reachable vertices
        }

        for (int v = 0; v < V; v++)
        {
            if (graph[u][v])
            {
                if (minHeap->pos[v] < minHeap->size && dist[u] != INT_MAX && dist[v] > dist[u] + 1)
                {
                    dist[v] = dist[u] + 1;
                    parent[v] = u;
                    decreaseKey(minHeap, v, dist[v]);
                }
            }
        }
    }

    // Después de ejecutar Dijkstra para encontrar todas las distancias y padres,
    // reconstruir los caminos a diferentes destinos y almacenarlos en top_paths.
    for (int i = 0; i < V; i++)
    {
        if (i == start_vertex)
        { // El camino a sí mismo
            int path_nodes[1];
            int path_len;
            global_start_time = clock();

            reconstructPath(V, parent, start_vertex, i, path_nodes, &path_len);
            if (path_len > 0)
            {
                clock_t total_end_time = clock();
                double total_time_taken = ((double)(total_end_time - global_start_time)) / CLOCKS_PER_SEC;
                insertIntoTopPaths(V, path_nodes, path_len, total_time_taken);
                total_paths_found_count++;
            }
        }
        else if (dist[i] != INT_MAX)
        {                      // Si el vértice es alcanzable
            int path_nodes[V]; // Suficientemente grande para cualquier camino simple
            int path_len;
            global_start_time = clock();
            reconstructPath(V, parent, start_vertex, i, path_nodes, &path_len);

            if (path_len > 0)
            {
                clock_t total_end_time = clock();
                double total_time_taken = ((double)(total_end_time - global_start_time)) / CLOCKS_PER_SEC;
                insertIntoTopPaths(V, path_nodes, path_len, total_time_taken);
                total_paths_found_count++;
            }
        }
    }

    freeMinHeap(minHeap);
}

int main(int argc, char *argv[])
{
    srand(time(NULL));

    int N_VERTICES;
    int start_vertex = 0;

    if (argc < 2)
    {
        fprintf(stderr, "Usage: %s <number_of_vertices> [start_vertex]\n", argv[0]);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Missing arguments. Usage: %s <number_of_vertices> [start_vertex]\"\n}\n", argv[0]);
        return 1;
    }

    N_VERTICES = atoi(argv[1]);

    if (argc > 2)
    {
        start_vertex = atoi(argv[2]);
    }

    if (N_VERTICES <= 0 || N_VERTICES > MAX_VERTICES)
    {
        fprintf(stderr, "Invalid number of vertices. Must be between 1 and %d.\n", MAX_VERTICES);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Invalid number of vertices. Must be between 1 and %d.\"\n}\n", MAX_VERTICES);
        return 1;
    }

    if (start_vertex < 0 || start_vertex >= N_VERTICES)
    {
        fprintf(stderr, "Error: Start vertex %d is out of range (0 to %d) for %d vertices.\n", start_vertex, N_VERTICES - 1, N_VERTICES);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Start vertex out of range\"\n}\n");
        return 1;
    }

    bool **graph = generateCompleteGraph(N_VERTICES);
    if (graph == NULL)
    {
        fprintf(stderr, "Failed to generate graph with %d vertices.\n", N_VERTICES);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Failed to generate graph with %d vertices.\"\n}\n", N_VERTICES);
        return 1;
    }

    initializeTopPaths();
    global_start_time = clock();

    dijkstra_for_output(N_VERTICES, graph, start_vertex);

    clock_t total_end_time = clock();
    double total_time_taken = ((double)(total_end_time - global_start_time)) / CLOCKS_PER_SEC;

    outputJsonResult(N_VERTICES, start_vertex, total_paths_found_count, total_time_taken);

    freeGraph(N_VERTICES, graph);
    freeTopPaths();

    return 0;
}