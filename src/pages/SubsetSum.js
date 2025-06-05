import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import React, { useState } from "react";


export default function SubsetSum() {
  const [numbers, setNumbers] = useState([5, 10, 20, 50]);
  const [targetSum, setTargetSum] = useState(75);
  const [newNumber, setNewNumber] = useState("");

  const addNumber = () => {
    const num = parseInt(newNumber);
    if (!isNaN(num)) {
      setNumbers([...numbers, num]);
      setNewNumber("");
    }
  };

  return (
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
    </div>
  )
}
