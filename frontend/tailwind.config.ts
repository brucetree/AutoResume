import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#000000',
        'primary-container': '#001453',
        'on-primary': '#ffffff',
        'on-primary-container': '#607cec',
        'on-primary-fixed': '#001453',
        'on-primary-fixed-variant': '#173bab',
        'primary-fixed': '#dde1ff',
        'primary-fixed-dim': '#b8c4ff',

        'secondary': '#505f76',
        'secondary-container': '#d0e1fb',
        'secondary-fixed': '#d3e4fe',
        'secondary-fixed-dim': '#b7c8e1',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#54647a',
        'on-secondary-fixed': '#0b1c30',
        'on-secondary-fixed-variant': '#38485d',

        'tertiary': '#000000',
        'tertiary-container': '#002113',
        'tertiary-fixed': '#6ffbbe',
        'tertiary-fixed-dim': '#4edea3',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#009668',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#005236',

        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        'surface': '#f7f9fb',
        'surface-bright': '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-variant': '#e0e3e5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'surface-tint': '#3755c3',

        'on-surface': '#191c1e',
        'on-surface-variant': '#45464d',
        'on-background': '#191c1e',
        'background': '#f7f9fb',
        'outline': '#76777d',
        'outline-variant': '#c6c6cd',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',
        'inverse-primary': '#b8c4ff',
      },
      fontFamily: {
        'headline': ['Manrope', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem',
      },
      boxShadow: {
        'ambient': '0px 24px 48px -12px rgba(25, 28, 30, 0.08)',
        'ambient-light': '0px 24px 48px -12px rgba(25, 28, 30, 0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
