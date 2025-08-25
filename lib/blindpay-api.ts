export interface BlindpayReceiver {
  receiverId: string
  email: string
}

export interface BlindpayVirtualAccount {
  id: string
  token: string
  blockchain_wallet_id: string
  us: {
    ach: {
      routing_number: string
      account_number: string
    }
    wire: {
      routing_number: string
      account_number: string
    }
    rtp: {
      routing_number: string
      account_number: string
    }
    swift_bic_code: string
    beneficiary: {
      name: string
      address_line_1: string
      address_line_2: string
    }
    receiving_bank: {
      name: string
      address_line_1: string
      address_line_2: string
    }
    account_type: string
  }
}

export async function getReceiverByEmail(email: string): Promise<BlindpayReceiver> {
  const response = await fetch(`/api/receivers?email=${encodeURIComponent(email)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch receiver")
  }

  return response.json()
}

export async function getVirtualAccount(receiverId: string): Promise<BlindpayVirtualAccount> {
  const response = await fetch(`/api/virtual-accounts/${receiverId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch virtual account")
  }

  return response.json()
}

export async function getDepositDataForUser(email: string): Promise<BlindpayVirtualAccount> {
  try {
    // First, get the receiver ID for this email
    const receiver = await getReceiverByEmail(email)

    // Then, get the virtual account data
    const virtualAccount = await getVirtualAccount(receiver.receiverId)

    return virtualAccount
  } catch (error) {
    console.error("Error getting deposit data:", error)
    throw error
  }
}
