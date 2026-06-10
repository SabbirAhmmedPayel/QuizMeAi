const BASE = 'http://127.0.0.1:8000'

export async function getModels() {
  const res = await fetch(`${BASE}/models`)
  if (!res.ok) throw new Error('Failed to fetch models')
  return res.json()
}

export async function uploadPdf(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(xhr.responseText || 'Upload failed'))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', `${BASE}/upload`)
    xhr.send(form)
  })
}

export async function askQuestion(question, model) {
  const res = await fetch(`${BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, model }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res
}

export async function summarize(level, model) {
  const res = await fetch(`${BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, model }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res
}

export async function generateQuiz(numQuestions) {
  const params = new URLSearchParams({ num_questions: String(numQuestions) })
  const res = await fetch(`${BASE}/generate-quiz?${params}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res.json()
}
