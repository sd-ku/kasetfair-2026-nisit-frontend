"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Loader2, User, GraduationCap, Building } from "lucide-react"

interface Question {
  id: string
  question_text: string
  question_type: string
  field_name: string
  is_required: boolean
  options?: string[]
  placeholder?: string
  section: string
  display_order: number
}

export function DynamicRegistrationForm() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {

  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      const requiredFields = questions.filter((q) => q.is_required)
      for (const field of requiredFields) {
        if (!formData[field.field_name]?.trim()) {
          throw new Error(`${field.question_text} is required`)
        }
      }

      // Prepare data for insertion
      const registrationData: Record<string, any> = {}
      questions.forEach((question) => {
        const value = formData[question.field_name]
        if (value) {
          if (question.question_type === "number") {
            registrationData[question.field_name] = Number.parseInt(value)
          } else {
            registrationData[question.field_name] = value
          }
        }
      })

      // const { error: insertError } = await supabase.from("registrations").insert(registrationData)

      // if (insertError) throw insertError

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "personal":
        return <User className="w-5 h-5 text-emerald-600" />
      case "academic":
        return <GraduationCap className="w-5 h-5 text-emerald-600" />
      default:
        return <Building className="w-5 h-5 text-emerald-600" />
    }
  }

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "personal":
        return "Personal Information"
      case "academic":
        return "Academic Information"
      case "preferences":
        return "Preferences"
      default:
        return "Additional Information"
    }
  }

  const renderField = (question: Question) => {
    const value = formData[question.field_name] || ""

    switch (question.question_type) {
      case "textarea":
        return (
          <Textarea
            id={question.field_name}
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => handleInputChange(question.field_name, e.target.value)}
            required={question.is_required}
            rows={3}
            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        )

      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(question.field_name, val)}>
            <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
              <SelectValue placeholder={question.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            id={question.field_name}
            type={question.question_type}
            placeholder={question.placeholder}
            value={value}
            onChange={(e) => handleInputChange(question.field_name, e.target.value)}
            required={question.is_required}
            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-emerald-600">Loading registration form...</span>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-emerald-800 mb-2">Registration Successful!</h3>
          <p className="text-emerald-700 mb-4">Thank you for registering for Kaset Fair 2026 Student Zone.</p>
          <p className="text-sm text-emerald-600">
            You will receive a confirmation email shortly with further details.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group questions by section
  const questionsBySection = questions.reduce(
    (acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = []
      }
      acc[question.section].push(question)
      return acc
    },
    {} as Record<string, Question[]>,
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.entries(questionsBySection).map(([section, sectionQuestions]) => (
        <div key={section} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            {getSectionIcon(section)}
            <h3 className="text-lg font-semibold text-gray-800">{getSectionTitle(section)}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionQuestions.map((question) => (
              <div key={question.id} className={question.question_type === "textarea" ? "md:col-span-2" : ""}>
                <Label htmlFor={question.field_name}>
                  {question.question_text}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(question)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting Registration...
          </>
        ) : (
          "Register for Kaset Fair 2024"
        )}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        By registering, you agree to receive updates about Kaset Fair 2024.
      </p>
    </form>
  )
}
