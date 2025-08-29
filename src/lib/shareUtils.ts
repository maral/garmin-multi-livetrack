/**
 * Generates a random 4-character string using letters and digits
 */
export function generateShareId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a consistent hash of the grid state for comparison
 */
export function generateStateHash(rows: number, cols: number, cellData: Record<string, { url: string; isEditing: boolean }>): string {
  // Create a normalized representation of the state
  const normalizedData = {
    rows,
    cols,
    // Only include the URLs, not the editing state, and sort by key for consistency
    cells: Object.keys(cellData)
      .sort()
      .reduce((acc, key) => {
        acc[key] = cellData[key].url
        return acc
      }, {} as Record<string, string>)
  }
  
  // Create a simple hash by converting to JSON and using a basic hash function
  const jsonString = JSON.stringify(normalizedData)
  let hash = 0
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
