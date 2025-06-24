#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
  //"Colores" Disponibles
    int Colores[9]= {1, 2, 3, 4, 5, 6, 7, 8, 9};
    bool Estatico[81] = {false}; // Guarda los vertices pre-coloreados
    // Mandado desde el frontend
    int sudoku [81];
    int matrizAd[81][81];

void RecorrerSudoku(int sudoku[81]) {
    for(int Gus=0; Gus < 81; Gus++) {
        if (sudoku[Gus] != 0) {
            Estatico[Gus] = true;
        } else {
            Estatico[Gus] = false;
        }
    }
}

bool Backtracking(int n){
    if(n == 81) {//Caso final
        return true; 
    }
    if(Estatico[n]){ //si ya esta coloreado lo salta(recursivo tambien)
        return Backtracking(n+1);
    }
    //caso recursivo
    for(int Pou=0; Pou<9; Pou++){
        bool valido = true;
        for(int Gus=0; Gus<81; Gus++){
            if(matrizAd[n][Gus]!=0 && sudoku[Gus] == Colores[Pou]){
                valido = false;
                break;
            }
        }
        
        if(valido){
            sudoku[n] = Colores[Pou];
            if(Backtracking(n + 1)){
                return true;
            }
            sudoku[n] = 0;
        }
    }
    return false;
}

int main(){
    // Leer el Sudoku 
    for (int i = 0; i < 81; i++) {
        if (scanf("%d", &sudoku[i]) != 1) {
            fprintf(stderr, "Error al leer sudoku.\n");
        }
    }

    // Leer la matriz de adyacencia (81x81)
    for (int i = 0; i < 81; i++) {
        for (int j = 0; j < 81; j++) {
            if (scanf("%d", &matrizAd[i][j]) != 1) {
                fprintf(stderr, "Error al leer matriz de adyacencia.\n");
            }
        }
    }
     RecorrerSudoku(sudoku);
     int n=0;
    clock_t inicio = clock();
    bool result = Backtracking(n);
    clock_t final = clock();
    double time_spent = (double)(final - inicio) / CLOCKS_PER_SEC;

    if (result) {
        printf("Sudoku resuelto:\n");
        for (int i = 0; i < 81; i++) {
            printf("%d", sudoku[i]);
            if ((i + 1) % 9 == 0) printf("\n");
            else printf(" ");
        }
    } else {
        printf("No se pudo resolver el Sudoku.\n");
    }

    printf("Tiempo de resolucion: %.6f segundos\n", time_spent);
    return 0;
}