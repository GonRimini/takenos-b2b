import { type NextRequest, NextResponse } from "next/server"
import { logError } from "@/lib/error-handler"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json()

    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })
    }

    const RETOOL_API_KEY = process.env.RETOOL_API_KEY
    if (!RETOOL_API_KEY) {
      logError("Missing RETOOL_API_KEY environment variable", "balance-poll-api")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log("[v0] Polling workflow status for ID:", workflowId)

    const response = await fetch(
      `https://api.retool.com/v1/workflows/26f0a051-0712-4184-854e-638edd43e929/runs/${workflowId}?environment=production`,
      {
        method: "GET",
        headers: {
          "X-Workflow-Api-Key": RETOOL_API_KEY.trim(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    )

    console.log("[v0] Poll response status:", response.status)

    if (!response.ok) {
      const msg = await response.text()
      console.log("[v0] Poll error response body:", msg)
      logError(`Retool poll API error ${response.status}: ${msg}`, "balance-poll-api")
      return NextResponse.json({ error: "Failed to poll workflow status" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Poll response:", JSON.stringify(data, null, 2))

    if (data.success && data.workflow_run) {
      const { status, result, outputs, data: workflowData, return_value, execution_result } = data.workflow_run
      console.log("[v0] Workflow status:", status)
      console.log("[v0] Workflow result:", result)
      console.log("[v0] Workflow outputs:", outputs)
      console.log("[v0] Workflow data:", workflowData)
      console.log("[v0] Workflow return_value:", return_value)
      console.log("[v0] Workflow execution_result:", execution_result)
      console.log("[v0] Full workflow_run object:", JSON.stringify(data.workflow_run, null, 2))
      console.log("[v0] Full response data:", JSON.stringify(data, null, 2))

      if (status === "SUCCESS" || status === "COMPLETED") {
        // Try to parse the result to get the balance
        let balance = "0.00"
        let error = null

        try {
          // First, try to get data from outputs if available
          let resultData = null
          
          if (outputs && outputs.length > 0) {
            console.log("[v0] Found outputs, trying to parse:", outputs)
            // Try to parse the first output
            const firstOutput = outputs[0]
            if (typeof firstOutput === "string") {
              try {
                resultData = JSON.parse(firstOutput)
              } catch (e) {
                console.log("[v0] Could not parse first output as JSON:", e)
              }
            } else {
              resultData = firstOutput
            }
          }
          
          // First, try the main data field since Retool returns data directly
          if (!resultData && data.data) {
            console.log("[v0] Found main data field:", data.data)
            resultData = { balance: data.data }
          }
          
          // Then try return_value since that's where Retool puts the return statement result
          if (!resultData && return_value) {
            console.log("[v0] Found return_value field:", return_value)
            resultData = typeof return_value === "string" ? JSON.parse(return_value) : return_value
          }
          
          // If no return_value, try to get from the workflow_run data directly
          if (!resultData && data.workflow_run && data.workflow_run.data) {
            console.log("[v0] No return_value found, trying workflow_run.data:", data.workflow_run.data)
            resultData = data.workflow_run.data
          }
          
          // If no data, try the result field
          if (!resultData && result) {
            console.log("[v0] No data found, trying result field:", result)
            resultData = typeof result === "string" ? JSON.parse(result) : result
          }
          
          // If still no resultData, try other possible fields
          if (!resultData && workflowData) {
            console.log("[v0] No result found, trying workflowData field:", workflowData)
            resultData = typeof workflowData === "string" ? JSON.parse(workflowData) : workflowData
          }
          
          if (!resultData && execution_result) {
            console.log("[v0] No return_value found, trying execution_result field:", execution_result)
            resultData = typeof execution_result === "string" ? JSON.parse(execution_result) : execution_result
          }
          
          console.log("[v0] Parsed resultData:", resultData)
          
          if (resultData) {
            // Look for balance in different possible formats
            if (resultData.data && Array.isArray(resultData.data) && resultData.data.length > 0) {
              // Format: {"data":[{"email":"...","balance":"33678.55"}]}
              const firstItem = resultData.data[0]
              if (firstItem.balance !== undefined) {
                balance = firstItem.balance.toString()
                console.log("[v0] Found balance in data array:", balance)
              }
            } else if (resultData.balance !== undefined) {
              balance = resultData.balance.toString()
              console.log("[v0] Found balance directly:", balance)
            } else if (resultData.data !== undefined) {
              balance = resultData.data.toString()
              console.log("[v0] Found data field:", balance)
            } else if (resultData.amount !== undefined) {
              balance = resultData.amount.toString()
              console.log("[v0] Found amount:", balance)
            } else if (resultData.total !== undefined) {
              balance = resultData.total.toString()
              console.log("[v0] Found total:", balance)
            } else if (typeof resultData === "number") {
              balance = resultData.toString()
              console.log("[v0] Found numeric result:", balance)
            } else if (typeof resultData === "string") {
              // Try to parse as number
              const parsed = parseFloat(resultData)
              if (!isNaN(parsed)) {
                balance = parsed.toString()
                console.log("[v0] Parsed string as number:", balance)
              }
            }
          } else {
            console.log("[v0] No result data found")
            error = "No result data available from workflow"
          }
        } catch (parseError) {
          console.log("[v0] Error parsing workflow result:", parseError)
          error = "Error parsing workflow result"
        }

        return NextResponse.json({
          status: "COMPLETED",
          balance,
          error,
          rawResult: result,
          rawOutputs: outputs,
        })
              } else if (status === "FAILED") {
          return NextResponse.json({
            status: "FAILED",
            error: "Workflow execution failed",
            balance: "0.00",
          })
        } else if (status === "PENDING" || status === "IN_PROGRESS") {
          // Still pending or in progress
          return NextResponse.json({
            status,
            balance: "0.00",
            error: null,
          })
        } else {
          // Other status (like SUCCESS but no result)
          console.log("[v0] Workflow completed but no result found, status:", status)
          return NextResponse.json({
            status: "COMPLETED",
            balance: "0.00",
            error: "Workflow completed but no balance data found",
            rawResult: result,
            rawOutputs: outputs,
          })
        }
    }

    return NextResponse.json({ error: "Unexpected response format" }, { status: 500 })
  } catch (error) {
    console.log("[v0] Poll caught error:", error)
    logError(error, "balance-poll-api")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
