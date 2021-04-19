import { Box, Card, CardContent, CardHeader } from '@material-ui/core'
import React from 'react'
import './App.css'
import { MeditationTable } from './features/meditation/MeditationTable'

function App() {
  return (
    <Box>
        <Card variant="outlined">
          <CardHeader title="Tempora"/>
          <CardContent>Hello</CardContent>
        </Card>
        <MeditationTable />
    </Box>
  )
}

export default App
