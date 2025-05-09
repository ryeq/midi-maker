# **App Name**: Midi Composer

## Core Features:

- Data Input: Text area allows input of `pitch_duration_data` in the exact format expected by the original script, including square brackets, parenthesis, commas, and floating point numbers.
- Data Conversion: Conversion function to read in `pitch_duration_data` from the text area. Error check for data which is malformed and cannot be passed to the Midi generation code.
- Midi Generation: Midi generation. Use the code from the google collab notebook, and take `pitch_duration_data` as an argument.
- Download Midi: Allow the user to download the .mid file.

## Style Guidelines:

- Background color: Light grey (#F0F0F0) for a clean and modern look.
- Accent color: Teal (#008080) to provide a primary action color.
- A single text input area. A single button that triggers the conversion and midi generation. Another element such as a button or link element to enable file download.
- Clean sans-serif font