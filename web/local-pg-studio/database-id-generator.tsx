"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, RefreshCw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Different ID generation strategies
const generateNanoId = (length = 21): string => {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return result
}

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateCUID = (): string => {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `c${timestamp}${randomPart}`
}

const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

const generateKSUID = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(36)
  const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("")
  return timestamp + randomBytes
}

export default function DatabaseIdGenerator() {
  const [idType, setIdType] = useState<string>("nanoid")
  const [length, setLength] = useState<number>(21)
  const [generatedId, setGeneratedId] = useState<string>("")
  const [prefix, setPrefix] = useState<string>("")
  const { toast } = useToast()

  const generateId = () => {
    let id = ""

    switch (idType) {
      case "nanoid":
        id = generateNanoId(length)
        break
      case "uuid":
        id = generateUUID()
        break
      case "cuid":
        id = generateCUID()
        break
      case "shortid":
        id = generateShortId()
        break
      case "ksuid":
        id = generateKSUID()
        break
      default:
        id = generateNanoId(length)
    }

    setGeneratedId(prefix ? `${prefix}_${id}` : id)
  }

  const copyToClipboard = async () => {
    if (generatedId) {
      await navigator.clipboard.writeText(generatedId)
      toast({
        title: "Copied!",
        description: "ID copied to clipboard",
      })
    }
  }

  const idTypeDescriptions = {
    nanoid: "URL-safe, compact, and collision-resistant (default 21 chars)",
    uuid: "Standard UUID v4 format with hyphens",
    cuid: "Collision-resistant unique identifier with timestamp",
    shortid: "Short random string (8-14 characters)",
    ksuid: "K-Sortable Unique Identifier with timestamp ordering",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Database ID Generator</h1>
          </div>
          <p className="text-gray-600">Generate unique identifiers for your database records</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Choose your ID type and customize the generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id-type">ID Type</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nanoid">NanoID</SelectItem>
                    <SelectItem value="uuid">UUID v4</SelectItem>
                    <SelectItem value="cuid">CUID</SelectItem>
                    <SelectItem value="shortid">ShortID</SelectItem>
                    <SelectItem value="ksuid">KSUID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix (optional)</Label>
                <Input
                  id="prefix"
                  placeholder="user, post, order..."
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
              </div>
            </div>

            {idType === "nanoid" && (
              <div className="space-y-2">
                <Label htmlFor="length">Length: {length}</Label>
                <input
                  type="range"
                  id="length"
                  min="8"
                  max="32"
                  value={length}
                  onChange={(e) => setLength(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>8</span>
                  <span>32</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{idType.toUpperCase()}:</strong> {idTypeDescriptions[idType as keyof typeof idTypeDescriptions]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated ID</CardTitle>
            <CardDescription>Click generate to create a new unique identifier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={generateId} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Generate ID
              </Button>
              {generatedId && (
                <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              )}
            </div>

            {generatedId && (
              <div className="space-y-2">
                <Label>Your Generated ID:</Label>
                <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm break-all">{generatedId}</div>
                <div className="text-xs text-gray-500">Length: {generatedId.length} characters</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Use Cases:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Primary keys in databases</li>
                  <li>• API resource identifiers</li>
                  <li>• Session tokens</li>
                  <li>• File names</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Properties:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• URL-safe characters</li>
                  <li>• Collision-resistant</li>
                  <li>• Cryptographically secure</li>
                  <li>• No dependencies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
