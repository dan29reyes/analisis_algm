#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define MAX_NUMBERS 10000
#define MAX_SOLUTIONS 10
#define MAX_STEPS 50000

typedef struct {
    int *solution_numbers;
    int solution_length;
    double time_found;
    int step_number;
} SolutionData;

typedef struct {
    int step_number;
    char action[20];
    int current_number;
    int current_index;
    int current_target;
    int *current_subset_indices;
    int *current_subset_values;
    int subset_length;
    double time_step;
} StepData;

SolutionData solutions[MAX_SOLUTIONS];
StepData steps[MAX_STEPS];
int current_solutions_count = 0;
int current_steps_count = 0;
int total_steps = 0;
clock_t global_start_time;

void initializeSolutions() {
    for (int i = 0; i < MAX_SOLUTIONS; i++) {
        solutions[i].solution_numbers = NULL;
        solutions[i].solution_length = 0;
        solutions[i].time_found = -1.0;
        solutions[i].step_number = 0;
    }
    current_steps_count = 0;
}

//llevar registro de pasos, para ui
void recordStep(const char* action, int current_number, int current_index, int current_target, int current_subset[], int subset_length, int numbers[]) {
    if (current_steps_count >= MAX_STEPS) return;
    
    clock_t current_time = clock();
    double time_elapsed = ((double)(current_time - global_start_time)) / CLOCKS_PER_SEC;
    
    steps[current_steps_count].step_number = total_steps;
    strcpy(steps[current_steps_count].action, action);
    steps[current_steps_count].current_number = current_number;
    steps[current_steps_count].current_index = current_index;
    steps[current_steps_count].current_target = current_target;
    steps[current_steps_count].subset_length = subset_length;
    steps[current_steps_count].time_step = time_elapsed;
    
    steps[current_steps_count].current_subset_indices = (int *)malloc(sizeof(int) * subset_length);
    steps[current_steps_count].current_subset_values = (int *)malloc(sizeof(int) * subset_length);
    
    if (steps[current_steps_count].current_subset_indices != NULL && steps[current_steps_count].current_subset_values != NULL) {
        for (int i = 0; i < subset_length; i++) {
            steps[current_steps_count].current_subset_indices[i] = current_subset[i];
            steps[current_steps_count].current_subset_values[i] = numbers[current_subset[i]];
        }
    }
    
    current_steps_count++;
}

void insertSolution(int current_subset[], int subset_length, int numbers[], double time_found, int step_number) {
    if (current_solutions_count < MAX_SOLUTIONS) {
        solutions[current_solutions_count].solution_numbers = (int *)malloc(sizeof(int) * subset_length);
        if (solutions[current_solutions_count].solution_numbers == NULL) {
            return;
        }
        
        for (int i = 0; i < subset_length; i++) {
            solutions[current_solutions_count].solution_numbers[i] = numbers[current_subset[i]];
        }
        
        solutions[current_solutions_count].solution_length = subset_length;
        solutions[current_solutions_count].time_found = time_found;
        solutions[current_solutions_count].step_number = step_number;
        current_solutions_count++;
    }
}

void outputJsonResult(int numbers[], int numbers_count, int target, bool solution_found, double total_time_taken, int algorithm_type) {
    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"numbers_count\": %d,\n", numbers_count);
    printf("  \"target_sum\": %d,\n", target);
    printf("  \"algorithm_type\": %d,\n", algorithm_type);
    printf("  \"solution_found\": %s,\n", solution_found ? "true" : "false");
    printf("  \"total_steps\": %d,\n", total_steps);
    printf("  \"total_time_seconds\": %.6f,\n", total_time_taken);
    printf("  \"input_numbers\": [");
    for (int i = 0; i < numbers_count; i++) {
        printf("%d%s", numbers[i], (i == numbers_count - 1) ? "" : ", ");
    }
    printf("],\n");
    
    printf("  \"backtracking_steps\": [\n");
    for (int i = 0; i < current_steps_count; i++) {
        printf("    {\n");
        printf("      \"step\": %d,\n", steps[i].step_number);
        printf("      \"action\": \"%s\",\n", steps[i].action);
        printf("      \"current_number\": %d,\n", steps[i].current_number);
        printf("      \"current_index\": %d,\n", steps[i].current_index);
        printf("      \"current_target\": %d,\n", steps[i].current_target);
        printf("      \"time_step\": %.6f,\n", steps[i].time_step);
        printf("      \"current_subset_indices\": [");
        if (steps[i].current_subset_indices != NULL) {
            for (int j = 0; j < steps[i].subset_length; j++) {
                printf("%d%s", steps[i].current_subset_indices[j], (j == steps[i].subset_length - 1) ? "" : ", ");
            }
        }
        printf("],\n");
        printf("      \"current_subset_values\": [");
        if (steps[i].current_subset_values != NULL) {
            for (int j = 0; j < steps[i].subset_length; j++) {
                printf("%d%s", steps[i].current_subset_values[j], (j == steps[i].subset_length - 1) ? "" : ", ");
            }
        }
        printf("]\n");
        printf("    }%s\n", (i == current_steps_count - 1) ? "" : ",");
    }
    printf("  ],\n");
    
    printf("  \"solutions\": [\n");
    for (int i = 0; i < current_solutions_count; i++) {
        printf("    {\n");
        printf("      \"solution_name\": \"Solución %d\",\n", i + 1);
        printf("      \"time_found_seconds\": %.6f,\n", solutions[i].time_found);
        printf("      \"step_found\": %d,\n", solutions[i].step_number);
        printf("      \"subset_length\": %d,\n", solutions[i].solution_length);
        printf("      \"subset\": [");
        for (int j = 0; j < solutions[i].solution_length; j++) {
            printf("%d%s", solutions[i].solution_numbers[j], (j == solutions[i].solution_length - 1) ? "" : ", ");
        }
        printf("]\n");
        printf("    }%s\n", (i == current_solutions_count - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

void freeSolutions() {
    for (int i = 0; i < current_solutions_count; i++) {
        if (solutions[i].solution_numbers != NULL) {
            free(solutions[i].solution_numbers);
            solutions[i].solution_numbers = NULL;
        }
    }
    current_solutions_count = 0;
    
    for (int i = 0; i < current_steps_count; i++) {
        if (steps[i].current_subset_indices != NULL) {
            free(steps[i].current_subset_indices);
            steps[i].current_subset_indices = NULL;
        }
        if (steps[i].current_subset_values != NULL) {
            free(steps[i].current_subset_values);
            steps[i].current_subset_values = NULL;
        }
    }
    current_steps_count = 0;
}

bool subsetSumRecursive(int numbers[], int numbers_count, int target, int index, int current_subset[], int subset_length) {
    total_steps++;

    if (index < numbers_count) {
        recordStep("consider", numbers[index], index, target, current_subset, subset_length, numbers);
    }

    // Casos Bases
    if (target == 0) {
        recordStep("solution", -1, index, target, current_subset, subset_length, numbers);
        clock_t current_time = clock();
        double time_elapsed = ((double)(current_time - global_start_time)) / CLOCKS_PER_SEC;
        insertSolution(current_subset, subset_length, numbers, time_elapsed, total_steps);
        return true;
    }

    // Casos Base
    if (index >= numbers_count || target < 0) {
        recordStep("backtrack", -1, index, target, current_subset, subset_length, numbers);
        return false;
    }

    // Incluir numero
    current_subset[subset_length] = index;
    recordStep("include", numbers[index], index, target - numbers[index], current_subset, subset_length + 1, numbers);
    
    if (subsetSumRecursive(numbers, numbers_count, target - numbers[index], index + 1, current_subset, subset_length + 1)) {
        return true;
    }

    // Excluir numero
    recordStep("exclude", numbers[index], index, target, current_subset, subset_length, numbers);
    return subsetSumRecursive(numbers, numbers_count, target, index + 1, current_subset, subset_length);
}

bool subsetSumApproximation(int numbers[], int numbers_count, int target, int index, int current_subset[], int subset_length) {
    total_steps++;
    
    if (target == 0) {
        recordStep("solution", -1, index, target, current_subset, subset_length, numbers);
        clock_t current_time = clock();
        double time_elapsed = ((double)(current_time - global_start_time)) / CLOCKS_PER_SEC;
        insertSolution(current_subset, subset_length, numbers, time_elapsed, total_steps);
        return true;
    }

    if (target < 0 || index >= numbers_count) {
        recordStep("backtrack", -1, index, target, current_subset, subset_length, numbers);
        return false;
    }

    for (int i = index; i < numbers_count; i++) {
        recordStep("consider", numbers[i], i, target, current_subset, subset_length, numbers);
        current_subset[subset_length] = i;
        recordStep("include", numbers[i], i, target - numbers[i], current_subset, subset_length + 1, numbers);
        
        if (subsetSumApproximation(numbers, numbers_count, target - numbers[i], i + 1, current_subset, subset_length + 1)) {
            return true;
        }
        
        recordStep("exclude", numbers[i], i, target, current_subset, subset_length, numbers);
    }

    return false;
}

void solveSubsetSum(int numbers[], int numbers_count, int target, int algorithm_type) {
    if (numbers_count <= 0 || target < 0) {
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Invalid input parameters\"\n}\n");
        return;
    }

    initializeSolutions();
    
    int *current_subset = (int *)malloc(sizeof(int) * numbers_count);
    if (current_subset == NULL) {
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Memory allocation failed\"\n}\n");
        return;
    }

    total_steps = 0;
    global_start_time = clock();

    bool solution_found = false;
    
    if (algorithm_type == 1) {
        solution_found = subsetSumRecursive(numbers, numbers_count, target, 0, current_subset, 0);
    } else {
        solution_found = subsetSumApproximation(numbers, numbers_count, target, 0, current_subset, 0);
    }

    clock_t end_time = clock();
    double total_time_taken = ((double)(end_time - global_start_time)) / CLOCKS_PER_SEC;

    outputJsonResult(numbers, numbers_count, target, solution_found, total_time_taken, algorithm_type);

    free(current_subset);
    freeSolutions();
}

int main(int argc, char *argv[]) {
    if (argc < 4) {
        fprintf(stderr, "Usage: %s <target> <algorithm_type> <number1> [number2] ...\n", argv[0]);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Missing arguments. Usage: %s <target> <algorithm_type> <number1> [number2] ...\"\n}\n", argv[0]);
        return 1;
    }

    int target = atoi(argv[1]);
    int algorithm_type = atoi(argv[2]);
    int numbers_count = argc - 3;
    
    if (numbers_count > MAX_NUMBERS) {
        fprintf(stderr, "Too many numbers. Maximum allowed: %d\n", MAX_NUMBERS);
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Too many numbers. Maximum allowed: %d\"\n}\n", MAX_NUMBERS);
        return 1;
    }

    int numbers[MAX_NUMBERS];
    for (int i = 0; i < numbers_count; i++) {
        numbers[i] = atoi(argv[i + 3]);
        if (numbers[i] < 0) {
            fprintf(stderr, "Invalid number: %d. All numbers must be non-negative.\n", numbers[i]);
            printf("{\n  \"status\": \"error\",\n  \"message\": \"All numbers must be non-negative\"\n}\n");
            return 1;
        }
    }

    if (algorithm_type != 1 && algorithm_type != 2) {
        fprintf(stderr, "Invalid algorithm type. Use 1 for exact or 2 for approximation.\n");
        printf("{\n  \"status\": \"error\",\n  \"message\": \"Invalid algorithm type. Use 1 for exact or 2 for approximation.\"\n}\n");
        return 1;
    }

    solveSubsetSum(numbers, numbers_count, target, algorithm_type);

    return 0;
}