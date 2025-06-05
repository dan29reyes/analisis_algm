import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";


export default function SubsetSum() {
  const [numbers, setNumbers] = useState([5, 10, 20, 50]);
  const [targetSum, setTargetSum] = useState(75);
  const [newNumber, setNewNumber] = useState("");
  const [bills, setBills] = useState([]);

  useEffect(() => {
    initializeBills()
  }, [numbers])

  const addNumber = () => {
    const num = parseInt(newNumber);
    if (!isNaN(num)) {
      setNumbers([...numbers, num]);
      setNewNumber("");
    }
  };

  const initializeBills = () => {
    const newBills = numbers.map((num, index) => ({
      value: num,
      id: index,
      isSelected: false,
      isActive: false,
    }))
    setBills(newBills)
  }

  return (
    //Parte de arriba (Se pide y visualiza informacion)
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card className="bg-black-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Poblema de el subconjunto</CardTitle>
          <CardDescription className="text-gray-400">
            Se estara utilizando billetes de diferente denominaciones para poder alcanzar una suma objetivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Billetes disponibles (Lps.)</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-600 bg-gray-800 rounded-lg min-h-[60px] items-center">
                {numbers.map((num, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-700 text-gray-200 border-gray-600"
                  >
                    Lps. {num}                    
                  </Badge>
                ))}
              </div>
              <label className="text-sm font-medium text-gray-300">Añadir Billete</label>
              <Input
                  type="number"
                  placeholder="Ingrese la denominacion del billete"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNumber()}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                
                <Button onClick={addNumber} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                </Button>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Objetivo</label>
                <Input
                  type="number"
                  value={targetSum}
                  onChange={(e) => setTargetSum(Number.parseInt(e.target.value) || 0)}
                  className="text-lg font-semibold bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/*Parte de abajo (Visualizacion de los billetes)}*/}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <AnimatePresence>
                {bills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    className="relative bg-gradient-to-br from-gray-800 to-gray-400 border-2 rounded-lg shadow-lg overflow-hidden"
                    style={{ width: "140px", height: "70px" }}
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{
                      scale: bill.isSelected ? 1.05 : 1,
                      opacity: 1,
                      rotateY: 0,
                      y: bill.isSelected ? -15 : 0,
                      boxShadow: bill.isSelected
                        ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ type: "spring",stiffness: 200, damping: 20 }}
                  >
                    {/* Diseno */}
                    <div className="absolute inset-0 p-2 flex flex-col justify-between">
                      <div className={`text-xs font-bold text-white-800 opacity-80 text-center`}>Banco Central de Honduras</div>
                      <div className={`text-s font-bold text-white-1000 text-center`}>Lps. {bill.value}</div>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
    </div>
  )
}
