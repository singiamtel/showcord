/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      primary: "#0F4C81",
      secondary: "#F2F2F2",
      white: "#FFFFFF",
      black: "#000000",
      blue: {
        100: "#5865F2",
        200: "#404EED",
        300: "#05A8FC",
      },
      gray: {
        100: "#F6F6F6",
        125: "#949BA4",
        150: "#B5B8BB",
        175: "#6D6F78",
        200: "#99AAB5",
        300: "#313338",
        350: "#36373D",
        375: "#383A40",
        400: "#23272A",
        450: "#404249",
        500: "#BDBDBD",
        600: "#2B2D31",
        700: "#1F2023",
        "border": "#1E1F22",
      },
      yellow: {
        "hl-body": "#444039",
        "hl-mark": "#EFB132",
      },
      red: {
        400: "#F54343",
      },
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      serif: ["Inter", "sans-serif"],
      mono: ["Verdana", "sans-serif"],
    },
  },
  plugins: [],
  safelist: [
    "border",
    "border-solid",
    "border-gray-border",
    "ml-14",
    "mr-14",
    "p-2",
    "p-5.5",
    "m-2",
    "w-[500px]",
    "h-[300px]",
    "text-sm",
  ],
};
