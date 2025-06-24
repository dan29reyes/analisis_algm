#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define MAX_VERTICES 15
#define MAX_TOP_PATHS 10

typedef struct
{
    int *path_nodes;
    int path_length;
    double time_taken;
} PathData;

PathData top_paths[MAX_TOP_PATHS];
int current_top_paths_count = 0;

int total_paths_found_count = 0;
clock_t global_start_time;

void initializeTopPaths()
{
    for (int i = 0; i < MAX_TOP_PATHS; i++)
    {
        top_paths[i].path_nodes = NULL;
        top_paths[i].path_length = 0;
        top_paths[i].time_taken = -1.0;
    }
}

void insertIntoTopPaths(int V, int current_path[], int current_pos, double time_taken)
{
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
        top_paths[current_top_paths_count].time_taken = time_taken;
        current_top_paths_count++;
    }
    else
    {
        int min_time_idx = 0;
        for (int i = 1; i < MAX_TOP_PATHS; i++)
        {
            if (top_paths[i].time_taken < top_paths[min_time_idx].time_taken)
            {
                min_time_idx = i;
            }
        }

        if (time_taken > top_paths[min_time_idx].time_taken)
        {
            free(top_paths[min_time_idx].path_nodes);
            top_paths[min_time_idx].path_nodes = (int *)malloc(sizeof(int) * current_pos);
            if (top_paths[min_time_idx].path_nodes == NULL)
            {
                perror("Error allocating memory for path replacement in top_paths");
                return;
            }
            memcpy(top_paths[min_time_idx].path_nodes, current_path, sizeof(int) * current_pos);
            top_paths[min_time_idx].path_length = current_pos;
            top_paths[min_time_idx].time_taken = time_taken;
        }
    }
}

int comparePaths(const void *a, const void *b)
{
    PathData *pathA = (PathData *)a;
    PathData *pathB = (PathData *)b;
    if (pathA->time_taken < pathB->time_taken)
        return 1;
    if (pathA->time_taken > pathB->time_taken)
        return -1;
    return 0;
}

// THIS FUNCTION NOW OUTPUTS JSON AND INCLUDES THE GRAPH
void outputJsonResult(int V, int start_vertex, int total_paths_found, double total_time_taken, bool **graph) // Added graph parameter
{
    // Sort the top_paths array by time (descending)
    qsort(top_paths, current_top_paths_count, sizeof(PathData), comparePaths);

    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"graph_vertices\": %d,\n", V);
    printf("  \"start_vertex\": %d,\n", start_vertex);
    printf("  \"total_paths_found\": %d,\n", total_paths_found);
    printf("  \"total_time_seconds\": %.6f,\n", total_time_taken);

    // Add graph representation here
    printf("  \"generated_graph\": [\n");
    for (int i = 0; i < V; i++)
    {
        printf("    [");
        for (int j = 0; j < V; j++)
        {
            printf("%d%s", graph[i][j] ? 1 : 0, (j == V - 1) ? "" : ", ");
        }
        printf("]%s\n", (i == V - 1) ? "" : ",");
    }
    printf("  ],\n");

    printf("  \"top_paths\": [\n");

    for (int i = 0; i < current_top_paths_count; i++)
    {
        printf("    {\n");
        printf("      \"name\": \"Camino %d\",\n", i + 1);
        printf("      \"time_taken_seconds\": %.6f,\n", top_paths[i].time_taken);
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

bool isSafe(int v, int current_path[], int current_pos)
{
    for (int i = 0; i < current_pos; i++)
    {
        if (current_path[i] == v)
        {
            return false;
        }
    }
    return true;
}

void findAllSimplePathsUtil(int V, bool **graph, int current_path[], int current_pos)
{
    if (current_pos >= 2)
    {
        total_paths_found_count++;
        clock_t current_time_tick = clock();
        double time_at_discovery = ((double)(current_time_tick - global_start_time)) / CLOCKS_PER_SEC;

        insertIntoTopPaths(V, current_path, current_pos, time_at_discovery);
    }

    int last_vertex = current_path[current_pos - 1];

    int *neighbors = (int *)malloc(sizeof(int) * V);
    if (neighbors == NULL)
    {
        perror("Error allocating memory for neighbors");
        return;
    }
    int num_neighbors = 0;
    for (int i = 0; i < V; i++)
    {
        if (graph[last_vertex][i] == 1)
        {
            neighbors[num_neighbors++] = i;
        }
    }

    if (num_neighbors > 0)
    {
        for (int i = 0; i < num_neighbors; i++)
        {
            int j = i + rand() / (RAND_MAX / (num_neighbors - i) + 1);
            int temp = neighbors[i];
            neighbors[i] = neighbors[j];
            neighbors[j] = temp;
        }
    }

    for (int i = 0; i < num_neighbors; i++)
    {
        int next_v = neighbors[i];

        if (isSafe(next_v, current_path, current_pos))
        {
            current_path[current_pos] = next_v;

            findAllSimplePathsUtil(V, graph, current_path, current_pos + 1);

            current_path[current_pos] = -1;
        }
    }

    free(neighbors);
}

void findAllSimplePaths(int V, bool **graph, int start_vertex)
{
    if (start_vertex < 0 || start_vertex >= V)
    {
        fprintf(stderr, "Error: Start vertex is out of range (0 to %d).\n", V - 1);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Start vertex out of range\"\n}\n");
        return;
    }
    if (V <= 0)
    {
        fprintf(stderr, "Error: Number of vertices must be positive.\n");
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Number of vertices must be positive\"\n}\n");
        return;
    }

    initializeTopPaths();

    int *current_path = (int *)malloc(sizeof(int) * V);
    if (current_path == NULL)
    {
        perror("Error allocating memory for path");
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Memory allocation failed for path\"\n}\n");
        return;
    }

    for (int i = 0; i < V; i++)
    {
        current_path[i] = -1;
    }

    current_path[0] = start_vertex;

    total_paths_found_count = 0;

    global_start_time = clock();

    findAllSimplePathsUtil(V, graph, current_path, 1);

    clock_t total_end_time = clock();
    double total_time_taken = ((double)(total_end_time - global_start_time)) / CLOCKS_PER_SEC;

    outputJsonResult(V, start_vertex, total_paths_found_count, total_time_taken, graph);

    free(current_path);
    freeTopPaths();
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

    bool **graph = generateCompleteGraph(N_VERTICES);
    if (graph == NULL)
    {
        fprintf(stderr, "Failed to generate graph with %d vertices.\n", N_VERTICES);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Failed to generate graph with %d vertices.\"\n}\n", N_VERTICES);
        return 1;
    }

    findAllSimplePaths(N_VERTICES, graph, start_vertex);

    freeGraph(N_VERTICES, graph);

    return 0;
}