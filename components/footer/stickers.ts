// Note card backgrounds. Light: the Figma "About me" page (862:857). Figma has
// no dark design, so each hue takes its dark color from the matching card in
// the About section (about-data.ts).
const COLORS = {
  blue: "bg-[#afcff5] dark:bg-[#046FD4]",
  pink: "bg-[#ffcde8] dark:bg-[#9D5B7F]",
  purple: "bg-[#9da4ff] dark:bg-[#565EC0]",
  orange: "bg-[#ff9c59] dark:bg-[#AF5800]",
  yellow: "bg-[#fecf27] dark:bg-[#8A6C00]",
} as const;

export type Sticker = {
  name: string;
  src: string;
  // Background classes for the note card that opens when the sticker is clicked.
  bg: string;
  // Shown uppercase at the bottom of the card.
  label: "Backstory" | "Quirks" | "How I work" | "Fun fact" | "Two cents";
  note: string;
};

const sticker = (
  name: string,
  color: keyof typeof COLORS,
  label: Sticker["label"],
  note: string,
): Sticker => ({
  name,
  src: encodeURI(`/footer/${name} sticker.png`),
  bg: COLORS[color],
  label,
  note,
});

export const STICKERS: Sticker[] = [
  sticker("Artist palette", "yellow", "Two cents", "I appreciate beautiful things, especially when nature has done all the work."),
  sticker("Bar chart", "orange", "How I work", "I love data, but I reserve the right to question what the numbers are actually telling us."),
  sticker("Bomb", "orange", "Fun fact", "I've accidentally opened a few cans of worms by asking one innocent question."),
  sticker("Bug", "orange", "How I work", "I test all my designs. Experience has taught me that the happy path isn't always the only one."),
  sticker("Checkmark", "yellow", "Fun fact", "I love ticking things off a list. Sometimes I add things I've already done just for the satisfaction."),
  sticker("Component", "blue", "How I work", "I love reusable systems, mostly because doing the same work twice feels like a personal loss."),
  sticker("Computer", "blue", "Backstory", "My dad introduced me to computers long before I knew what I wanted to do with one."),
  sticker("Cursor", "purple", "Quirks", "I'm naturally curious. Which is a nice way of saying I click on absolutely everything."),
  sticker("Database", "purple", "Quirks", "I like things organized. My downloads folder would suggest otherwise."),
  sticker("Design", "orange", "Quirks", "I can be fussy about tiny details and surprisingly relaxed about everything else."),
  sticker("Email", "pink", "Quirks", "I have a soft spot for a well-written message. Especially one that gets straight to the point."),
  sticker("Finder", "blue", "How I work", "I like working with people who have opinions, a sense of humor, and an open mind."),
  sticker("Folder", "blue", "Quirks", "I just keep my workspace neat because my brain works better that way."),
  sticker("Globe", "yellow", "Backstory", "I'm Polish, design worldwide, and spend falls and winters in the Canary Islands."),
  sticker("Highlighter", "orange", "Fun fact", "I tend to highlight so much in books that the highlights stop meaning anything."),
  sticker("Layers", "blue", "How I work", "I like uncovering what makes complex things tick, then making them feel simple."),
  sticker("Light bulb", "yellow", "Fun fact", "My best ideas rarely come at my desk, but while I'm walking or focused elsewhere."),
  sticker("Like", "pink", "Quirks", "I'm usually pretty good at reading the room. Sometimes before anyone's said a word."),
  sticker("Palette fan", "yellow", "Quirks", "I can spot the difference between two almost identical grays. It's both a skill and a curse."),
  sticker("Pencil and brush", "pink", "How I work", "I like figuring things out as I go. Some of my best ideas started as experiments."),
  sticker("Pencil", "pink", "Fun fact", "I think better when I write things down. Even if I never look at those notes again."),
  sticker("Pie chart", "yellow", "How I work", "My ideal workday: 30% thinking, 30% making, 40% so absorbed I lose time."),
  sticker("Pin", "orange", "Backstory", "I've lived in Poland most of my life, but part of me is permanently pinned to the Canary Islands."),
  sticker("Rabbit", "blue", "Quirks", "I like following my curiosity, especially when it leads somewhere unexpected."),
  sticker("Shortcuts", "pink", "Quirks", "I'll spend 20 minutes learning a shortcut to save myself five seconds."),
  sticker("Spray", "purple", "Two cents", "I believe most things can be improved with a little color. Except maybe Excel."),
  sticker("Text selection", "purple", "Backstory", "As a teenager, I dreamed of becoming a journalist. I still love a good story and asking questions."),
  sticker("Toolkit", "purple", "How I work", "I'm glad to learn a new tool if it solves a problem, but not just because it's trendy."),
  sticker("Vector pen", "pink", "Quirks", "I've made peace with the fact that not everything in life needs perfectly aligned anchor points."),
  sticker("Website", "purple", "Fun fact", "I've spent years making products easier to use. Building my own portfolio is somehow harder."),
];
