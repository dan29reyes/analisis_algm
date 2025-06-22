#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define MAX_GRAPH_VERTICES 15
#define MAX_KEPT_PATHS 10

typedef struct
{
    int *nodes;
    int length;
    double discovery_time;
} PathRecord;

static PathRecord s_top_paths[MAX_KEPT_PATHS];
static int s_top_paths_count = 0;
static int s_total_paths_found = 0;
static clock_t s_global_start_time;

static void initPathRecords()
{
    for (int i = 0; i < MAX_KEPT_PATHS; ++i)
    {
        s_top_paths[i].nodes = NULL;
        s_top_paths[i].length = 0;
        s_top_paths[i].discovery_time = -1.0;
    }
}

static int comparePathRecords(const void *a, const void *b)
{
    const PathRecord *path_a = (const PathRecord *)a;
    const PathRecord *path_b = (const PathRecord *)b;
    if (path_a->discovery_time < path_b->discovery_time)
        return 1;
    if (path_a->discovery_time > path_b->discovery_time)
        return -1;
    return 0;
}

static void addPathToTopRecords(int current_graph_vertices, const int *current_path, int current_path_len, double discovery_time_val)
{
    if (s_top_paths_count < MAX_KEPT_PATHS)
    {
        s_top_paths[s_top_paths_count].nodes = (int *)malloc(sizeof(int) * current_path_len);
        if (s_top_paths[s_top_paths_count].nodes == NULL)
        {
            perror("Memory allocation failed for new path record");
            return;
        }
        memcpy(s_top_paths[s_top_paths_count].nodes, current_path, sizeof(int) * current_path_len);
        s_top_paths[s_top_paths_count].length = current_path_len;
        s_top_paths[s_top_paths_count].discovery_time = discovery_time_val;
        s_top_paths_count++;
    }
    else
    {
        int oldest_path_idx = 0;
        for (int i = 1; i < MAX_KEPT_PATHS; ++i)
        {
            if (s_top_paths[i].discovery_time < s_top_paths[oldest_path_idx].discovery_time)
            {
                oldest_path_idx = i;
            }
        }

        if (discovery_time_val > s_top_paths[oldest_path_idx].discovery_time)
        {
            free(s_top_paths[oldest_path_idx].nodes);
            s_top_paths[oldest_path_idx].nodes = (int *)malloc(sizeof(int) * current_path_len);
            if (s_top_paths[oldest_path_idx].nodes == NULL)
            {
                perror("Memory allocation failed for replacing path record");
                return;
            }
            memcpy(s_top_paths[oldest_path_idx].nodes, current_path, sizeof(int) * current_path_len);
            s_top_paths[oldest_path_idx].length = current_path_len;
            s_top_paths[oldest_path_idx].discovery_time = discovery_time_val;
        }
    }
}

static void cleanupPathRecords()
{
    for (int i = 0; i < s_top_paths_count; ++i)
    {
        free(s_top_paths[i].nodes);
        s_top_paths[i].nodes = NULL;
    }
    s_top_paths_count = 0;
}

static bool isVertexSafe(int vertex, const int *current_path_arr, int current_path_len)
{
    for (int i = 0; i < current_path_len; ++i)
    {
        if (current_path_arr[i] == vertex)
        {
            return false;
        }
    }
    return true;
}

static void findPathsRecursive(int num_vertices, bool **adjacency_matrix, int *current_path_buffer, int current_path_pos)
{
    if (current_path_pos >= 2)
    {
        s_total_paths_found++;
        clock_t current_tick = clock();
        double time_since_start = ((double)(current_tick - s_global_start_time)) / CLOCKS_PER_SEC;
        addPathToTopRecords(num_vertices, current_path_buffer, current_path_pos, time_since_start);
    }

    int last_node_in_path = current_path_buffer[current_path_pos - 1];

    int *connected_neighbors = (int *)malloc(sizeof(int) * num_vertices);
    if (connected_neighbors == NULL)
    {
        perror("Memory allocation failed for neighbors array");
        return;
    }
    int neighbor_count = 0;
    for (int i = 0; i < num_vertices; ++i)
    {
        if (adjacency_matrix[last_node_in_path][i])
        {
            connected_neighbors[neighbor_count++] = i;
        }
    }

    if (neighbor_count > 0)
    {
        for (int i = 0; i < neighbor_count; ++i)
        {
            int j = i + rand() / (RAND_MAX / (neighbor_count - i) + 1);
            int temp = connected_neighbors[i];
            connected_neighbors[i] = connected_neighbors[j];
            connected_neighbors[j] = temp;
        }
    }

    for (int i = 0; i < neighbor_count; ++i)
    {
        int next_vertex = connected_neighbors[i];

        if (isVertexSafe(next_vertex, current_path_buffer, current_path_pos))
        {
            current_path_buffer[current_path_pos] = next_vertex;
            findPathsRecursive(num_vertices, adjacency_matrix, current_path_buffer, current_path_pos + 1);
            current_path_buffer[current_path_pos] = -1;
        }
    }
    free(connected_neighbors);
}

static bool **createCompleteGraph(int num_vertices)
{
    bool **graph_matrix = (bool **)malloc(sizeof(bool *) * num_vertices);
    if (graph_matrix == NULL)
    {
        perror("Failed to allocate memory for graph rows pointer");
        return NULL;
    }
    for (int i = 0; i < num_vertices; ++i)
    {
        graph_matrix[i] = (bool *)malloc(sizeof(bool) * num_vertices);
        if (graph_matrix[i] == NULL)
        {
            perror("Failed to allocate memory for graph row");
            for (int k = 0; k < i; ++k)
                free(graph_matrix[k]);
            free(graph_matrix);
            return NULL;
        }
        for (int j = 0; j < num_vertices; ++j)
        {
            graph_matrix[i][j] = (i != j);
        }
    }
    return graph_matrix;
}

static void destroyGraph(int num_vertices, bool **graph_matrix)
{
    if (graph_matrix == NULL)
        return;
    for (int i = 0; i < num_vertices; ++i)
    {
        free(graph_matrix[i]);
    }
    free(graph_matrix);
}

static void printResultsAsJson(int num_vertices, int start_node, int paths_count, double total_execution_time)
{
    qsort(s_top_paths, s_top_paths_count, sizeof(PathRecord), comparePathRecords);

    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"graph_vertices\": %d,\n", num_vertices);
    printf("  \"start_vertex\": %d,\n", start_node);
    printf("  \"total_paths_found\": %d,\n", paths_count);
    printf("  \"total_time_seconds\": %.6f,\n", total_execution_time);
    printf("  \"top_paths\": [\n");

    for (int i = 0; i < s_top_paths_count; ++i)
    {
        printf("    {\n");
        printf("      \"name\": \"Camino %d\",\n", i + 1);
        printf("      \"time_taken_seconds\": %.6f,\n", s_top_paths[i].discovery_time);
        printf("      \"path_length\": %d,\n", s_top_paths[i].length);
        printf("      \"path\": [");
        for (int j = 0; j < s_top_paths[i].length; ++j)
        {
            printf("%d%s", s_top_paths[i].nodes[j], (j == s_top_paths[i].length - 1) ? "" : ", ");
        }
        printf("]\n");
        printf("    }%s\n", (i == s_top_paths_count - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

void executePathFinding(int num_vertices, bool **graph_matrix, int start_node)
{
    if (start_node < 0 || start_node >= num_vertices)
    {
        fprintf(stderr, "Error: Start vertex %d is out of range (0 to %d).\n", start_node, num_vertices - 1);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Start vertex out of range\"\n}\n");
        return;
    }
    if (num_vertices <= 0)
    {
        fprintf(stderr, "Error: Number of vertices must be positive.\n");
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Number of vertices must be positive\"\n}\n");
        return;
    }

    initPathRecords();

    int *path_buffer = (int *)malloc(sizeof(int) * num_vertices);
    if (path_buffer == NULL)
    {
        perror("Memory allocation failed for path buffer");
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Memory allocation failed for path buffer\"\n}\n");
        return;
    }

    memset(path_buffer, -1, sizeof(int) * num_vertices);

    path_buffer[0] = start_node;

    s_total_paths_found = 0;
    s_global_start_time = clock();

    findPathsRecursive(num_vertices, graph_matrix, path_buffer, 1);

    clock_t end_time = clock();
    double total_duration = ((double)(end_time - s_global_start_time)) / CLOCKS_PER_SEC;

    printResultsAsJson(num_vertices, start_node, s_total_paths_found, total_duration);

    free(path_buffer);
    cleanupPathRecords();
}

int main(int argc, char *argv[])
{
    srand(time(NULL));

    int num_graph_vertices;
    int starting_vertex = 0;

    if (argc < 2)
    {
        fprintf(stderr, "Usage: %s <number_of_vertices> [start_vertex]\n", argv[0]);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Missing arguments. Usage: %s <number_of_vertices> [start_vertex]\"\n}\n", argv[0]);
        return 1;
    }

    num_graph_vertices = atoi(argv[1]);

    if (argc > 2)
    {
        starting_vertex = atoi(argv[2]);
    }

    if (num_graph_vertices <= 0 || num_graph_vertices > MAX_GRAPH_VERTICES)
    {
        fprintf(stderr, "Invalid number of vertices. Must be between 1 and %d.\n", MAX_GRAPH_VERTICES);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Invalid number of vertices. Must be between 1 and %d.\"\n}\n", MAX_GRAPH_VERTICES);
        return 1;
    }

    bool **graph = createCompleteGraph(num_graph_vertices);
    if (graph == NULL)
    {
        fprintf(stderr, "Failed to generate graph with %d vertices.\n", num_graph_vertices);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Failed to generate graph with %d vertices.\"\n}\n");
        return 1;
    }

    executePathFinding(num_graph_vertices, graph, starting_vertex);

    destroyGraph(num_graph_vertices, graph);

    return 0;
}