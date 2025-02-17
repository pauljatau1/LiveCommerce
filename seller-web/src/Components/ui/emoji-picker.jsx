import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Card } from '../ui/card'

export function EmojiPicker({ onEmojiSelect }) {
  return (
    <div className="absolute bottom-16 left-0 z-50">
      <Card className="border shadow-lg">
        <Picker 
          data={data} 
          onEmojiSelect={onEmojiSelect}
          theme="light"
          set="native"
          previewPosition="none"
          skinTonePosition="none"
          maxFrequentRows={2}
        />
      </Card>
    </div>
  )
} 