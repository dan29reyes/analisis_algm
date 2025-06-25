import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, RotateCcw, Lock, Unlock} from "lucide-react";
import subsetSumAccess from "@/pages/api/AccessPoints/subsetSum-access";

export default function SubsetSum() {
  const [numbers, setNumbers] = useState([2, 3, 5, 7]);
  const [targetSum, setTargetSum] = useState(20);
  const [newNumber, setNewNumber] = useState("");
  const [NumberGeneration, setNumberGeneration] = useState("");
  const [bills, setBills] = useState([]);
  const [solution, setSolution] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [solutionFound, setSolutionFound] = useState(false);
  const [message, setMessage] = useState("");
  const [stepCount, setStepCount] = useState(0);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [subsetSumInfo, setSubsetSumInfo] = useState(null);
  const [algorithmType, setAlgorithmType] = useState(1);
  
  const [backtrackingSteps, setBacktrackingSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [playSpeed] = useState(600); 
  const [currentSubset, setCurrentSubset] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [currentAction, setCurrentAction] = useState("");

  useEffect(() => {
    initializeBills()
  }, [numbers])

  useEffect(() => {
    let interval;
    if (isVisualizing && currentStepIndex < backtrackingSteps.length - 1) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= backtrackingSteps.length - 1) {
            setIsVisualizing(false);
          }
          return nextIndex;
        });
      }, playSpeed);
    }
    return () => clearInterval(interval);
  }, [isVisualizing, currentStepIndex, backtrackingSteps.length, playSpeed]);

  useEffect(() => {
    if (backtrackingSteps.length > 0 && !isRunning) {
      setTimeout(() => {
        setCurrentStepIndex(-1);
        setIsVisualizing(true);
      }, 500);
    }
  }, [backtrackingSteps, isRunning]);

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < backtrackingSteps.length) {
      const step = backtrackingSteps[currentStepIndex];
      updateVisualizationFromStep(step);
    }
  }, [currentStepIndex, backtrackingSteps]);

  const updateVisualizationFromStep = (step) => {
    setCurrentAction(step.action);
    setCurrentTarget(step.current_target);
    setCurrentSubset(step.current_subset_values || []);
    
    // Actualizar billetes
    setBills(prevBills => prevBills.map((bill, index) => {
      const isInCurrentSubset = step.current_subset_indices && step.current_subset_indices.includes(index);
      const isBeingConsidered = index === step.current_index;
      
      return {
        ...bill,
        // Verde: Solo para la solución final
        isSelected: step.action === 'solution' && isInCurrentSubset,
        // Naranja: TODOS los billetes que están en la combinación actual
        isActive: isInCurrentSubset && step.action !== 'solution',
        // Amarillo: Solo el billete específico que se está considerando ahora
        isconsidering: isBeingConsidered && !isInCurrentSubset && (step.action === 'consider' || step.action === 'exclude'),
      };
    }));
  };

  const addNumber = () => {
    const num = parseInt(newNumber);
    if (!isNaN(num) && num >= 0) {
      setNumbers([...numbers, num]);
      setNewNumber("");
      resetAlgorithm();
    }
  };

  const addRandomNumbers = (count) => {
    const newNums = Array.from({ length: count }, () => Math.floor(Math.random() * 100) + 1);
    setNumbers([...numbers, ...newNums]);
    resetAlgorithm();
  };

  const initializeBills = () => {
    const newBills = numbers.map((num, index) => ({
      value: num,
      id: index,
      isSelected: false,
      isActive: false,
      isconsidering: false,
    }))
    setBills(newBills)
  }

  const resetAlgorithm = () => {
    setSolution([]);
    setIsRunning(false);
    setSolutionFound(false);
    setMessage("");
    setStepCount(0);
    setVaultOpen(false);
    setExecutionTime(null);
    setSubsetSumInfo(null);
    setBacktrackingSteps([]);
    setCurrentStepIndex(-1);
    setIsVisualizing(false);
    setCurrentSubset([]);
    setCurrentTarget(0);
    setCurrentAction("");
    
    const resetBills = bills.map(bill => ({
      ...bill,
      isSelected: false,
      isActive: false,
      isconsidering: false,
    }));
    setBills(resetBills);
  }

  const highlightSolutionBills = (solutionNumbers) => {
    setBills(prevBills => prevBills.map(bill => ({
      ...bill,
      isSelected: solutionNumbers.includes(bill.value),
      isActive: false,
      isconsidering: false,
    })));
  };

  const startAlgorithm = async (algorithmType) => {
    if (targetSum < 1) {
      setMessage("Por favor, ingrese un objetivo válido mayor a 0.");
      return;
    }

    setIsRunning(true);
    setStepCount(0);
    setVaultOpen(false);
    setMessage("");
    setSolutionFound(false);
    setSolution([]);
    setSubsetSumInfo(null);
    setExecutionTime(null);
    setBacktrackingSteps([]);
    setCurrentStepIndex(-1);
    setIsVisualizing(false);
    setCurrentTarget(targetSum);
    setCurrentAction("");
    
    // Tipo
    const algorithmName = algorithmType === 1 ? 'Exacto' : 'Aproximado';
    setMessage(`Ejecutando Protocolo ${algorithmName}...`);

    try {
      const response = await subsetSumAccess.getSubsetSumInfo(numbers, targetSum, algorithmType);
      
      if (response && response.status === 'success') {
        setStepCount(response.total_steps);
        setExecutionTime(response.total_time_seconds * 1000);
        
        if (response.backtracking_steps && response.backtracking_steps.length > 0) {
          setBacktrackingSteps(response.backtracking_steps);
          setMessage(`Protocolo ${algorithmName} completado. Visualizando ${response.backtracking_steps.length} pasos...`);
        } else {
          setMessage(`Protocolo ${algorithmName} completado sin pasos de visualización.`);
        }
        
        let formattedInfo = `Tiempo total: ${response.total_time_seconds} segundos\n`;
        formattedInfo += `Cantidad de números: ${response.numbers_count}\n`;
        formattedInfo += `Objetivo: ${response.target_sum}\n`;
        formattedInfo += `Algoritmo: ${algorithmName}\n`;
        formattedInfo += `Pasos totales: ${response.total_steps}\n`;
        formattedInfo += `Pasos de backtracking: ${response.backtracking_steps ? response.backtracking_steps.length : 0}\n`;
        
        if (response.solution_found && response.solutions.length > 0) {
          setSolutionFound(true);
          setVaultOpen(true);
          
          const firstSolution = response.solutions[0];
          setSolution(firstSolution.subset);
          
          formattedInfo += `\nSoluciones encontradas:\n`;
          response.solutions.forEach((sol, index) => {
            formattedInfo += `${sol.solution_name}: [${sol.subset.join(', ')}]\n`;
            formattedInfo += `  Tiempo: ${sol.time_found_seconds}s, Paso: ${sol.step_found}\n`;
          });
        } else {
          setSolutionFound(false);
          setMessage(`Acceso denegado. No existe combinación para Lps. ${targetSum}`);
        }
        
        setSubsetSumInfo(formattedInfo);
        
      } else {
        setMessage("Error en la respuesta del servidor");
        console.error("Invalid response:", response);
      }
    } catch (error) {
      setMessage("Error en el sistema de seguridad");
      console.error("API Error:", error);
    }

    setIsRunning(false);
  };

  const playVisualization = () => {
    if (backtrackingSteps.length > 0) {
      setIsPlaying(true);
      if (currentStepIndex >= backtrackingSteps.length - 1) {
        setCurrentStepIndex(-1);
      }
    }
  };

  const pauseVisualization = () => {
    setIsPlaying(false);
  };

  const stopVisualization = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    initializeBills();
    setCurrentSubset([]);
    setCurrentTarget(targetSum);
    setCurrentAction("");
    setConsideringIndex(-1);
  };

  const stepForward = () => {
    if (currentStepIndex < backtrackingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const getBillStyle = (bill) => {
    if (bill.isSelected && solutionFound) {
      return 'bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 border-green-300';
    } else if (bill.isActive) {
      return 'bg-gradient-to-br from-orange-600 via-orange-500 to-orange-800 border-orange-300';
    } else if (bill.isconsidering) {
      return 'bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-800 border-yellow-300';
    } else {
      return 'bg-gradient-to-br from-slate-600 via-zinc-700 to-slate-800 border-slate-500';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'consider': return 'text-yellow-400';
      case 'include': return 'text-blue-400';
      case 'exclude': return 'text-red-400';
      case 'backtrack': return 'text-purple-400';
      case 'solution': return 'text-green-400';
      default: return 'text-amber-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-900 p-6">
      {/*BACKGROUND */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #374151 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #374151 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              BANCO CENTRAL DE HONDURAS
            </h1>
          </div>
          <p className="text-xl text-amber-200 font-semibold tracking-wide">
            SISTEMA DE SEGURIDAD AVANZADO • SUBSET SUM PROTOCOL • VISUALIZACIÓN AUTOMÁTICA
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 mx-auto mt-4 rounded-full"></div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-zinc-800/80 via-slate-800/80 to-zinc-900/80 rounded-3xl border-2 border-amber-500/30 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }} 
        >
          <p className="text-amber-400 font-semibold">
            Situación Actual del Banco Central de Honduras
          </p>
          <p className="text-amber-300 text-sm mt-2">
            Es un viernes por la tarde en el Banco Central de Honduras. De repente, suena la alarma roja en el sistema de seguridad. Un cliente muy importante necesita retirar una cantidad exacta de dinero para una transacción urgente, pero hay un problema: el sistema de seguridad automático se ha activado y solo permitirá el acceso si se encuentra la combinación perfecta de billetes.
            <br />
            Es por eso que el equipo de seguridad del banco ha implementado un protocolo de verificación recursiva para encontrar la combinación correcta de billetes que sumen exactamente. Llamado "Subset Sum Protocol", este algoritmo busca entre las denominaciones disponibles para desbloquear la bóveda y permitir el acceso al cliente.
          </p>  
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-zinc-800 via-slate-800 to-zinc-900 rounded-3xl border-4 border-amber-500/30 shadow-2xl overflow-hidden"
          style={{
            boxShadow: `
              inset 0 0 30px rgba(251, 191, 36, 0.1),
              0 0 50px rgba(0, 0, 0, 0.8),
              0 0 100px rgba(251, 191, 36, 0.1)
            `
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* PARTE DE ARRIBA */}
          <div className="bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-amber-600/20 p-6 border-b-2 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: isRunning ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isRunning ? Infinity : 0, ease: "linear" }}
                >
                  {vaultOpen ? <Unlock className="w-8 h-8 text-green-400" /> : <Lock className="w-8 h-8 text-amber-400" />}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-100">CONTROL DE ACCESO</h2>
                  <p className="text-amber-300">Algoritmo de Verificación Recursiva</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-amber-300 text-sm">ESTADO DEL SISTEMA</div>
                <div className={`text-lg font-bold ${vaultOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {vaultOpen ? 'ACCESO CONCEDIDO' : isRunning ? 'PROCESANDO...' : 'BLOQUEADO'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Controles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-700/50 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/20">
                  <label className="text-amber-300 font-semibold mb-3 block flex items-center gap-2">
                    $$ CANTIDAD OBJETIVO (Lps.)
                  </label>
                  <Input
                    type="number"
                    value={targetSum}
                    onChange={(e) => {
                      setTargetSum(Number.parseInt(e.target.value) || 0);
                      resetAlgorithm();
                    }}
                    className="text-2xl font-bold bg-zinc-900/80 border-2 border-amber-500/40 text-amber-100 h-14 text-center rounded-xl focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>

                {/* DENOMINACIONES QUE HAY ACTUALMENTE*/}
                <div className="bg-gradient-to-br from-slate-700/50 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/20">
                  <label className="text-amber-300 font-semibold mb-3 block">DENOMINACIONES DISPONIBLES</label>
                  <div className="flex flex-wrap gap-3 p-4 border-2 border-amber-500/30 bg-zinc-900/50 rounded-xl min-h-[80px] items-center">
                    {numbers.map((num, index) => (
                      <Badge
                        key={index}
                        className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-bold px-4 py-2 text-lg border-2 border-amber-400 shadow-lg"
                      >
                        Lps. {num}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Input
                      type="number"
                      placeholder="Nueva denominación"
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNumber()}
                      className="bg-zinc-900/80 border-amber-500/40 text-amber-100 placeholder-amber-300/50 focus:border-amber-400"
                    />
                    <Button 
                      onClick={addNumber} 
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold px-6 border-2 border-amber-400"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-700/50 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/20">
                  <label className="text-amber-300 font-semibold mb-3 block">AGREGA UNA CANTIDAD ESPECÍFICA DE BILLETES</label>
                  <div className="flex gap-3 mt-4">
                    <Input
                      type="number"
                      placeholder="Cantidad de billetes"
                      value={NumberGeneration}
                      onChange={(e) => setNumberGeneration(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addRandomNumbers(parseInt(NumberGeneration))}
                      className="bg-zinc-900/80 border-amber-500/40 text-amber-100 placeholder-amber-300/50 focus:border-amber-400"
                    />
                    <Button
                      onClick={() => addRandomNumbers(parseInt(NumberGeneration))}
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold px-6 border-2 border-amber-400"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* ESTADO ACTUAL  */}
                <div className="bg-gradient-to-br from-slate-700/50 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/20">
                  <label className="text-amber-300 font-semibold mb-3 block">ESTADO DEL SISTEMA</label>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-amber-500/20">
                      <div className="text-amber-400 text-sm">SOLUCIÓN</div>
                      <div className="text-2xl font-bold text-amber-100">
                        {solution.length > 0 ? `Lps. ${solution.reduce((a, b) => a + b, 0)}` : '--'}
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-amber-500/20">
                      <div className="text-amber-400 text-sm">OBJETIVO</div>
                      <div className="text-2xl font-bold text-amber-100">Lps. {targetSum}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* BOTONES */}
                <div className="bg-gradient-to-br from-slate-700/50 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/20">
                  <label className="text-amber-300 font-semibold mb-4 block">CONTROLES DE SEGURIDAD</label>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => startAlgorithm(1)} 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 text-lg border-2 border-green-400 shadow-lg"
                      disabled={isRunning}
                    >
                      <Play className="h-6 w-6 mr-3" />
                      {isRunning ? 'PROCESANDO...' : 'INICIAR PROTOCOLO EXACTO'}
                    </Button>

                    <Button 
                      onClick={() => startAlgorithm(2)} 
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 text-lg border-2 border-blue-400 shadow-lg"
                      disabled={isRunning}
                    >
                      <Play className="h-6 w-6 mr-3" />
                      {isRunning ? 'PROCESANDO...' : 'INICIAR PROTOCOLO APROXIMADO'}
                    </Button>
                    
                    <Button 
                      onClick={resetAlgorithm} 
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-4 text-lg border-2 border-red-400 shadow-lg"
                      disabled={isRunning}
                    >
                      <RotateCcw className="h-6 w-6 mr-3" />
                      REINICIAR SISTEMA
                    </Button>
                  </div>
                </div>

                {/* TIEMPO DE EJECUCION */} 
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border-2 border-purple-500/30 h-[377px] flex flex-col justify-center items-center">
                  <div className="text-center">
                    <div className="text-purple-300 text-lg mb-2">TIEMPO DE PROCESAMIENTO</div>
                    <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-4">
                      {isRunning ? '⟳' : executionTime !== null ? `${executionTime.toFixed(2)} ms` : '--'}
                    </div>
                    <div className="text-purple-300 text-sm">
                      Último análisis completado
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MENSAJE  */}
            {message && !solutionFound && message.includes('No existe') && (
              <motion.div 
                className="bg-gradient-to-r from-red-900/30 to-rose-900/30 rounded-2xl p-6 border-2 border-red-500/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-center font-bold text-xl text-red-300 flex items-center justify-center gap-3">
                  <Lock className="w-6 h-6" />
                  {message}
                </p>
              </motion.div>
            )}

            {/* VISUALIZACION SOLUCION */}
            {solution.length > 0 && solutionFound && (
              <motion.div 
                className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-2xl p-8 border-4 border-green-400/60"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <h3 className="text-green-300 text-2xl font-bold mb-6 text-center flex items-center justify-center gap-3">
                  <Unlock className="w-8 h-8" />
                  BÓVEDA DESBLOQUEADA! - COMBINACIÓN CORRECTA
                </h3>
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  {solution.map((value, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, rotateY: 180 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-xl px-6 py-3 font-bold border-4 border-green-300 shadow-2xl">
                        Lps. {value}
                      </Badge>
                    </motion.div>
                  ))}
                  <span className="text-green-200 text-2xl font-bold ml-6 bg-green-900/50 px-6 py-3 rounded-xl border-2 border-green-400">
                    = Lps. {solution.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* VISUALIZACION DE BILLETES */}
        <motion.div 
          className="bg-gradient-to-br from-zinc-800/80 via-slate-800/80 to-zinc-900/80 rounded-3xl border-2 border-amber-500/30 p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-amber-100 mb-2">BÓVEDA - VISUALIZACIÓN EN TIEMPO REAL</h3>
            <p className="text-amber-300">Billetes en custodia del sistema de seguridad</p>
            <div className="flex justify-center gap-8 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-300"></div>
                <span className="text-amber-300">Considerando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded border border-orange-300"></div>
                <span className="text-amber-300">Combinación Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border border-green-300"></div>
                <span className="text-amber-300">Solución Final</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <AnimatePresence>
              {bills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  className={`relative rounded-2xl shadow-2xl overflow-hidden border-4 ${getBillStyle(bill)}`}
                  style={{ width: "180px", height: "90px" }}
                  initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                  animate={{
                    scale: bill.isActive || bill.isSelected || bill.isconsidering ? 1.15 : 1,
                    opacity: 1,
                    rotateY: 0,
                    y: bill.isActive || bill.isSelected || bill.isconsidering ? -15 : 0,
                    boxShadow: bill.isActive || bill.isSelected || bill.isconsidering
                      ? "0 25px 50px -12px rgba(251, 191, 36, 0.4), 0 20px 25px -5px rgba(251, 191, 36, 0.3)"
                      : "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {/* PATRON DE SEGURIDAD */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  {/* INFO QUE CONTIENE EL BILLETE */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="text-xs font-bold text-white opacity-90 text-center">
                      BANCO CENTRAL DE HONDURAS
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        Lps. {bill.value}
                      </div>
                    </div>
                    <div className="text-xs text-white opacity-60 text-center">
                      SISTEMA DE LA BÓVEDA
                    </div>
                  </div>

                  {/* BORDE SI ESTA ACTIVO */}
                  {(bill.isActive || bill.isSelected || bill.isconsidering) && (
                    <motion.div
                      className={`absolute inset-0 border-4 rounded-2xl ${
                        bill.isSelected ? 'border-green-200' : 
                        bill.isActive ? 'border-orange-200' : 'border-yellow-200'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>


        <motion.div 
          className="text-center py-6 border-t border-amber-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-amber-400 font-semibold">
            SISTEMA DE SEGURIDAD AVANZADO • SUBSET SUM PROTOCOL • VISUALIZACIÓN AUTOMÁTICA
          </p>
        </motion.div>
      </div>
    </div>
  )
}