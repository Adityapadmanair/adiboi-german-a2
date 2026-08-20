Adiboi's German Time (A2)
A desktop-oriented vocabulary trainer built with React. It uses 12 separate chapter files to help you learn German at the A2 level. You type the English translation for each German word, and the app tracks your correct and wrong answers for every chapter.

The progress stays saved in your browser, so you can close the window and come back later without losing your streak.

How it works
The app loads 12 JSON files (A2Chapter1.json through A2Chapter12.json) from the public folder. Each file contains an array of vocabulary objects. When you select a chapter, the app shuffles the words and presents them one by one.

You type the English meaning into the input field. If you get it right, the app saves it under "Correct" for that chapter. If you type a wrong answer or hit the "Show Answer" button, it goes into "Wrong".

A small twist: the app uses a fuzzy matching algorithm, so if you write something very close to the actual translation (like "to be glad" instead of "to be happy"), it still counts as correct.

Key Features
Dark mode interface with a sidebar that slides out when you hover your mouse over the left edge of the screen.

A top progress bar showing how many words you have completed in the current chapter.

Separate progress bars for each chapter in the sidebar, showing percentage completed.

A dedicated "View Progress" button that opens a modal listing every word you got right and every word you got wrong.

Persistent progress: all scores and word lists are saved to your browser's localStorage.

Reset button that clears a chapter's progress. If the chapter is not 100% complete, it asks for confirmation before wiping the data.

Where to put the JSON files
The app expects your 12 chapter files to be located inside a data folder within the public directory of the React project.

Your final file structure should look like this:

Your project folder should look like this:

```text
your-project-folder/
- public/
  - data/
    - A2Chapter1.json
    - A2Chapter2.json
    - A2Chapter3.json
    - ...
    - A2Chapter12.json
- src/
  - App.js
  - App.css
  - index.js
- package.json

```text


The JSON objects inside each file must follow this format:

json
{
  "german": "die Currywurst",
  "info": "die Currywurst, -würste",
  "english": "sausage with curry sauce",
  "example": "(German fastfood dish)"
}

Installation and setup
Make sure you have Node.js installed on your machine before running these commands.

Clone the repository and navigate into the folder:

bash
git clone [your-repo-url]
cd adiboi-german-a2
Install the required dependencies:

bash
npm install
Place your 12 JSON files into the public/data/ folder as described above. Start the development server:

bash
npm start
The app will open at http://localhost:3000 in your default browser.

Building for production
If you want to host this somewhere online, run the build command:

bash
npm run build
This creates a build folder with all the optimized static files. You can drag and drop this folder onto free hosting services like Netlify or Vercel to get a live URL in a few seconds.

Technologies used
React (create-react-app)

Plain CSS

Browser localStorage for data persistence

Contributing
If you notice a bug or want to add a feature, feel free to open an issue or submit a pull request. I'd be happy to review it.

License
This project is open source and available for personal use and modification.