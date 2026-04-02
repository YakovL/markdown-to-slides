import { createElement } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { renderToStaticMarkup } from 'react-dom/server'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import pptxgen from 'pptxgenjs'
import type { SlideTheme } from '@/types/theme'

interface MarkdownComponentProps {
  children?: ReactNode
  href?: string
  inline?: boolean
  style?: CSSProperties
}

const MarkdownComponents = (theme?: SlideTheme) => ({
  h1: ({ children }: MarkdownComponentProps) => createElement('h1', {
    style: {
      fontFamily: theme?.fonts.heading,
      color: theme?.styles.heading,
      marginBottom: theme?.spacing.headingMargin,
      background: 'none'
    }
  }, children),
  h2: ({ children }: MarkdownComponentProps) => createElement('h2', {
    style: {
      fontFamily: theme?.fonts.heading,
      color: theme?.styles.heading,
      marginBottom: theme?.spacing.headingMargin,
      background: 'none'
    }
  }, children),
  h3: ({ children }: MarkdownComponentProps) => createElement('h3', {
    style: {
      fontFamily: theme?.fonts.heading,
      color: theme?.styles.heading,
      marginBottom: theme?.spacing.headingMargin,
      background: 'none'
    }
  }, children),
  p: ({ children }: MarkdownComponentProps) => createElement('p', {
    style: {
      fontFamily: theme?.fonts.body,
      color: theme?.styles.text,
      marginBottom: theme?.spacing.paragraphMargin,
      background: 'none'
    }
  }, children),
  code: ({ inline, children }: MarkdownComponentProps) => {
    if (inline) {
      return createElement('code', {
        style: {
          fontFamily: theme?.fonts.code,
          color: theme?.styles.code,
          background: 'none'
        }
      }, children)
    }
    // For block code, create pre and code elements separately
    return createElement('pre', {
      style: {
        margin: '1em 0',
        padding: '1em',
        background: 'none'
      }
    }, createElement('code', {
      style: {
        fontFamily: theme?.fonts.code,
        color: theme?.styles.code,
        background: 'none',
        display: 'block'
      }
    }, children))
  },
  blockquote: ({ children }: MarkdownComponentProps) => createElement('blockquote', {
    style: {
      color: theme?.styles.blockquote,
      borderLeftColor: theme?.styles.accent,
      background: 'none'
    }
  }, children),
  a: ({ children, href }: MarkdownComponentProps) => createElement('a', {
    href,
    style: { color: theme?.styles.link, background: 'none' }
  }, children)
})

export async function exportToPDF(slides: string[], theme?: SlideTheme) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'a4',
    putOnlyUsedFonts: true,
  })

  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()

  for (let index = 0; index < slides.length; index++) {
    if (index > 0) {
      pdf.addPage()
    }

    // Create a temporary container for the slide
    const container = document.createElement('div')
    container.style.width = `${width}px`
    container.style.height = `${height}px`
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.backgroundColor = theme?.styles.background || (document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'

    const contentWrapper = document.createElement('div')
    contentWrapper.style.width = '100%'
    contentWrapper.style.maxWidth = '75%'
    contentWrapper.className = 'prose max-w-none text-center'

    // Add base styles
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .prose {
        color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')};
        font-family: ${theme?.fonts.body || 'system-ui'};
        background: none;
        font-size: 11px;
        max-width: none;
        width: 100%;
      }
      .prose h1 {
        font-size: 1.6em;
        margin-top: 0;
        line-height: 1.2;
        margin-bottom: 0.5em;
      }
      .prose h2 {
        font-size: 1.3em;
        margin-top: 0;
        line-height: 1.2;
        margin-bottom: 0.4em;
      }
      .prose h3 {
        font-size: 1.1em;
        margin-top: 0;
        line-height: 1.2;
        margin-bottom: 0.3em;
      }
      .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
        font-family: ${theme?.fonts.heading || 'system-ui'} !important;
        background: none !important;
        -webkit-background-clip: unset !important;
        -webkit-text-fill-color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
      }
      .prose p {
        color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
        font-family: ${theme?.fonts.body || 'system-ui'} !important;
        margin-bottom: 0.4em;
        background: none !important;
        font-size: 0.9em;
        line-height: 1.3;
      }
      .prose code {
        color: ${theme?.styles.code || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#1a1a1a')} !important;
        font-family: ${theme?.fonts.code || 'monospace'} !important;
        background: none !important;
        font-size: 0.85em;
      }
      .prose pre {
        margin: 0.4em 0;
        padding: 0.4em;
      }
      .prose a {
        color: ${theme?.styles.link || (document.documentElement.classList.contains('dark') ? '#60a5fa' : '#0066cc')} !important;
        background: none !important;
      }
      .prose blockquote {
        color: ${theme?.styles.blockquote || (document.documentElement.classList.contains('dark') ? '#a1a1aa' : '#666666')} !important;
        border-left-color: ${theme?.styles.accent || (document.documentElement.classList.contains('dark') ? '#3f3f46' : '#e5e5e5')} !important;
        background: none !important;
        font-size: 0.9em;
        margin: 0.4em 0;
        padding-left: 0.6em;
      }
      .prose ul, .prose ol {
        margin: 0.3em 0;
        padding-left: 1em;
      }
      .prose li {
        margin: 0.15em 0;
        line-height: 1.3;
      }
    `
    container.appendChild(styleElement)

    // Convert markdown to HTML with math expressions
    const html = renderToStaticMarkup(
      createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [
          [rehypeKatex, {
            strict: false,
            trust: true,
            throwOnError: false,
            globalGroup: true,
            output: 'html'
          }]
        ],
        className: 'prose max-w-none text-center',
        components: MarkdownComponents(theme)
      }, slides[index])
    )

    contentWrapper.innerHTML = html
    container.appendChild(contentWrapper)
    document.body.appendChild(container)

    try {
      // Render the slide to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme?.styles.background || '#ffffff',
        logging: false,
      })

      // Add the canvas content to PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    } finally {
      // Clean up
      document.body.removeChild(container)
    }
  }

  // Save the PDF
  pdf.save('slides.pdf')
}

export async function exportToPPTX(slides: string[], theme?: SlideTheme, buttonRect?: DOMRect) {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_16x9'

  // Create dialog element
  const dialog = document.createElement('div')
  dialog.style.position = 'fixed'
  dialog.style.zIndex = '9999'
  dialog.style.backgroundColor = theme?.styles.background || (document.documentElement.classList.contains('dark') ? '#1c1c1c' : '#ffffff')
  dialog.style.border = `1px solid ${document.documentElement.classList.contains('dark') ? '#333333' : '#e5e5e5'}`
  dialog.style.borderRadius = '8px'
  dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
  dialog.style.padding = '16px'
  dialog.style.width = '320px'

  // Position the dialog near the button
  if (buttonRect) {
    dialog.style.left = `${buttonRect.left}px`
    dialog.style.top = `${buttonRect.bottom + 8}px`
  } else {
    dialog.style.left = '50%'
    dialog.style.top = '50%'
    dialog.style.transform = 'translate(-50%, -50%)'
  }

  // Add title
  const title = document.createElement('h3')
  title.textContent = 'Export PowerPoint'
  title.style.margin = '0 0 12px 0'
  title.style.fontSize = '16px'
  title.style.fontWeight = '600'
  title.style.color = theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')
  dialog.appendChild(title)

  // Create options container
  const optionsContainer = document.createElement('div')
  optionsContainer.style.display = 'flex'
  optionsContainer.style.flexDirection = 'column'
  optionsContainer.style.gap = '12px'

  // Image-based option
  const imageOption = document.createElement('button')
  imageOption.style.display = 'flex'
  imageOption.style.alignItems = 'center'
  imageOption.style.padding = '12px'
  imageOption.style.border = `1px solid ${document.documentElement.classList.contains('dark') ? '#333333' : '#e5e5e5'}`
  imageOption.style.borderRadius = '6px'
  imageOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#2d2d2d' : '#f9f9f9'
  imageOption.style.cursor = 'pointer'
  imageOption.style.width = '100%'
  imageOption.style.textAlign = 'left'
  imageOption.innerHTML = `
    <div style="flex: 1;">
      <div style="font-weight: 500; margin-bottom: 4px; color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')}">Image-based PowerPoint</div>
      <div style="font-size: 13px; color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#a0a0a0' : '#666666')}">Perfect styling, exactly like preview</div>
    </div>
  `
  imageOption.addEventListener('mouseover', () => {
    imageOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#3d3d3d' : '#f0f0f0'
  })
  imageOption.addEventListener('mouseout', () => {
    imageOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#2d2d2d' : '#f9f9f9'
  })

  // Editable option
  const editableOption = document.createElement('button')
  editableOption.style.display = 'flex'
  editableOption.style.alignItems = 'center'
  editableOption.style.padding = '12px'
  editableOption.style.border = `1px solid ${document.documentElement.classList.contains('dark') ? '#333333' : '#e5e5e5'}`
  editableOption.style.borderRadius = '6px'
  editableOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#2d2d2d' : '#f9f9f9'
  editableOption.style.cursor = 'pointer'
  editableOption.style.width = '100%'
  editableOption.style.textAlign = 'left'
  editableOption.innerHTML = `
    <div style="flex: 1;">
      <div style="font-weight: 500; margin-bottom: 4px; color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')}">Editable PowerPoint</div>
      <div style="font-size: 13px; color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#a0a0a0' : '#666666')}">Not recommended - formatting will be lost</div>
    </div>
  `
  editableOption.addEventListener('mouseover', () => {
    editableOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#3d3d3d' : '#f0f0f0'
  })
  editableOption.addEventListener('mouseout', () => {
    editableOption.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#2d2d2d' : '#f9f9f9'
  })

  optionsContainer.appendChild(imageOption)
  optionsContainer.appendChild(editableOption)
  dialog.appendChild(optionsContainer)

  // Add close button
  const closeButton = document.createElement('button')
  closeButton.innerHTML = '×'
  closeButton.style.position = 'absolute'
  closeButton.style.right = '12px'
  closeButton.style.top = '12px'
  closeButton.style.border = 'none'
  closeButton.style.background = 'none'
  closeButton.style.fontSize = '20px'
  closeButton.style.cursor = 'pointer'
  closeButton.style.color = theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')
  closeButton.style.padding = '4px'
  closeButton.style.lineHeight = '1'
  dialog.appendChild(closeButton)

  document.body.appendChild(dialog)

  const choice = await new Promise<boolean | null>((resolve) => {
    const cleanup = () => {
      document.body.removeChild(dialog)
      document.removeEventListener('click', handleClickOutside)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!dialog.contains(event.target as Node)) {
        cleanup()
        resolve(null)
      }
    }

    closeButton.onclick = () => {
      cleanup()
      resolve(null)
    }

    imageOption.onclick = () => {
      cleanup()
      resolve(false)
    }

    editableOption.onclick = () => {
      cleanup()
      resolve(true)
    }

    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  })

  // If user cancelled, return without exporting
  if (choice === null) return

  for (let index = 0; index < slides.length; index++) {
    const pptxSlide = pptx.addSlide()

    if (choice) {
      // Set slide background color
      if (theme?.styles?.background) {
        pptxSlide.background = { color: theme.styles.background }
      } else {
        pptxSlide.background = { 
          color: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff'
        }
      }

      // Convert markdown to HTML first to get proper formatting
      const html = renderToStaticMarkup(
        createElement(ReactMarkdown, {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            [rehypeKatex, {
              strict: false,
              trust: true,
              throwOnError: false,
              globalGroup: true,
              output: 'html'
            }]
          ],
          className: 'prose max-w-none',
          components: MarkdownComponents(theme)
        }, slides[index])
      )

      // Parse the HTML to extract structured content
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Function to get text content without math delimiters
      const cleanMathText = (text: string) => {
        return text.replace(/\$\$(.*?)\$\$/g, '$1').replace(/\$(.*?)\$/g, '$1')
      }

      // Get theme colors with proper dark/light mode handling
      const getThemeColor = (themeColor?: string) => {
        if (themeColor) return themeColor;
        return document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
      }

      // Get all content elements in order
      const allElements = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre'))
      let currentY = 5 // Start from top

      // Function to calculate text height based on content
      const calculateTextHeight = (text: string, fontSize: number) => {
        const charsPerLine = 90 // Approximate characters per line
        const linesOfText = Math.ceil(text.length / charsPerLine)
        return Math.max(linesOfText * (fontSize / 44) * 8, 8) // Minimum 8% height
      }

      allElements.forEach((el) => {
        const text = cleanMathText(el.textContent || '')
        if (!text.trim()) return

        const tag = el.tagName.toLowerCase()
        
        switch(tag) {
          case 'h1':
            pptxSlide.addText(text, {
              y: `${currentY}%`,
              x: '5%',
              w: '90%',
              h: '12%',
              fontSize: 44,
              fontFace: theme?.fonts.heading || 'Arial',
              color: getThemeColor(theme?.styles.heading),
              bold: true,
              align: 'center',
              valign: 'middle',
              margin: [5, 0, 5, 0],
              isTextBox: true,
              autoFit: true,
              breakLine: true
            })
            currentY += 14
            break

          case 'h2':
            pptxSlide.addText(text, {
              y: `${currentY}%`,
              x: '5%',
              w: '90%',
              h: '10%',
              fontSize: 36,
              fontFace: theme?.fonts.heading || 'Arial',
              color: getThemeColor(theme?.styles.heading),
              bold: true,
              align: 'center',
              valign: 'middle',
              margin: [5, 0, 5, 0],
              isTextBox: true,
              autoFit: true,
              breakLine: true
            })
            currentY += 12
            break

          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            pptxSlide.addText(text, {
              y: `${currentY}%`,
              x: '5%',
              w: '90%',
              h: '8%',
              fontSize: 28,
              fontFace: theme?.fonts.heading || 'Arial',
              color: getThemeColor(theme?.styles.heading),
              bold: true,
              align: 'center',
              valign: 'middle',
              margin: [5, 0, 5, 0],
              isTextBox: true,
              autoFit: true,
              breakLine: true
            })
            currentY += 10
            break

          case 'ul':
          case 'ol':
            const items = Array.from(el.children)
              .map(li => li.textContent?.trim())
              .filter((item): item is string => item !== undefined)
            
            if (items.length > 0) {
              const listHeight = Math.max(items.length * 8, 10)
              const formattedItems = items.map(item => item.replace(/\$(.*?)\$/g, '($1)'))
              
              pptxSlide.addText(formattedItems.join('\\n'), {
                y: `${currentY}%`,
                x: '10%',
                w: '80%',
                h: `${listHeight}%`,
                fontSize: 24,
                fontFace: theme?.fonts.body || 'Arial',
                color: getThemeColor(theme?.styles.text),
                bullet: { type: tag === 'ol' ? 'number' : 'bullet' },
                align: 'left',
                valign: 'top',
                margin: [0, 0, 0, 20],
                paraSpaceBefore: 5,
                paraSpaceAfter: 5,
                breakLine: true,
                isTextBox: true,
                lineSpacing: 150
              })
              currentY += listHeight + 4
            }
            break

          case 'blockquote':
            const quoteHeight = calculateTextHeight(text, 24)
            pptxSlide.addText(text, {
              y: `${currentY}%`,
              x: '15%',
              w: '70%',
              h: `${quoteHeight}%`,
              fontSize: 24,
              fontFace: theme?.fonts.body || 'Arial',
              color: getThemeColor(theme?.styles.blockquote),
              italic: true,
              align: 'left',
              valign: 'middle',
              margin: [5, 0, 5, 40],
              isTextBox: true,
              autoFit: true,
              breakLine: true,
              lineSpacing: 150
            })
            currentY += quoteHeight + 4
            break

          case 'pre':
            const codeHeight = calculateTextHeight(text, 20)
            pptxSlide.addText(text, {
              y: `${currentY}%`,
              x: '10%',
              w: '80%',
              h: `${codeHeight}%`,
              fontSize: 20,
              fontFace: theme?.fonts.code || 'Consolas',
              color: getThemeColor(theme?.styles.code),
              align: 'left',
              valign: 'middle',
              margin: [10, 10, 10, 10],
              paraSpaceBefore: 5,
              paraSpaceAfter: 5,
              isTextBox: true,
              autoFit: true,
              breakLine: true,
              lineSpacing: 150
            })
            currentY += codeHeight + 4
            break

          default: // paragraphs and other elements
            // Handle math expressions by wrapping them in parentheses
            const processedText = text.replace(/\$(.*?)\$/g, '($1)')
            const paraHeight = calculateTextHeight(processedText, 24)
            
            pptxSlide.addText(processedText, {
              y: `${currentY}%`,
              x: '5%',
              w: '90%',
              h: `${paraHeight}%`,
              fontSize: 24,
              fontFace: theme?.fonts.body || 'Arial',
              color: getThemeColor(theme?.styles.text),
              align: 'left',
              valign: 'middle',
              margin: [5, 0, 5, 0],
              paraSpaceBefore: 2,
              paraSpaceAfter: 2,
              isTextBox: true,
              autoFit: true,
              breakLine: true,
              lineSpacing: 150
            })
            currentY += paraHeight + 2
        }

        // Add spacing between elements
        currentY += 2
      })

      // Handle images after all text content
      const images = doc.getElementsByTagName('img')
      if (images.length > 0) {
        const img = images[0]
        const remainingSpace = 100 - currentY
        if (remainingSpace >= 20) {
          pptxSlide.addImage({
            path: img.src,
            x: '25%',
            y: `${currentY}%`,
            w: '50%',
            h: `${Math.min(remainingSpace - 5, 40)}%`
          })
        }
      }
    } else {
      // Image-based export
      const container = document.createElement('div')
      container.style.width = '1600px'
      container.style.height = '900px'
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.backgroundColor = theme?.styles.background || (document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff')
      container.style.display = 'flex'
      container.style.alignItems = 'center'
      container.style.justifyContent = 'center'

      const contentWrapper = document.createElement('div')
      contentWrapper.style.width = '100%'
      contentWrapper.style.maxWidth = '75%'
      contentWrapper.className = 'prose max-w-none text-center'

      // Add base styles
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        .prose {
          color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')};
          font-family: ${theme?.fonts.body || 'system-ui'};
          background: none;
          font-size: 12px;
          max-width: none;
          width: 100%;
        }
        .prose h1 {
          font-size: 1.7em;
          margin-top: 0;
          line-height: 1.2;
          margin-bottom: 0.8em;
        }
        .prose h2 {
          font-size: 1.3em;
          margin-top: 0;
          line-height: 1.2;
          margin-bottom: 0.7em;
        }
        .prose h3 {
          font-size: 1.1em;
          margin-top: 0;
          line-height: 1.2;
          margin-bottom: 0.6em;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
          font-family: ${theme?.fonts.heading || 'system-ui'} !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: ${theme?.styles.heading || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
        }
        .prose p {
          color: ${theme?.styles.text || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')} !important;
          font-family: ${theme?.fonts.body || 'system-ui'} !important;
          margin-bottom: 0.6em;
          background: none !important;
          font-size: 0.9em;
          line-height: 1.4;
        }
        .prose code {
          color: ${theme?.styles.code || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#1a1a1a')} !important;
          font-family: ${theme?.fonts.code || 'monospace'} !important;
          background: none !important;
          font-size: 0.85em;
        }
        .prose pre {
          margin: 0.5em 0;
          padding: 0.5em;
        }
        .prose a {
          color: ${theme?.styles.link || (document.documentElement.classList.contains('dark') ? '#60a5fa' : '#0066cc')} !important;
          background: none !important;
        }
        .prose blockquote {
          color: ${theme?.styles.blockquote || (document.documentElement.classList.contains('dark') ? '#a1a1aa' : '#666666')} !important;
          border-left-color: ${theme?.styles.accent || (document.documentElement.classList.contains('dark') ? '#3f3f46' : '#e5e5e5')} !important;
          background: none !important;
          font-size: 0.9em;
          margin: 0.6em 0;
          padding-left: 0.8em;
        }
        .prose ul, .prose ol {
          margin: 0.4em 0;
          padding-left: 1.2em;
        }
        .prose li {
          margin: 0.2em 0;
        }
      `
      container.appendChild(styleElement)

    // Convert markdown to HTML with math expressions
    const html = renderToStaticMarkup(
      createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [
          [rehypeKatex, {
            strict: false,
            trust: true,
            throwOnError: false,
            globalGroup: true,
            output: 'html'
          }]
        ],
          className: 'prose prose-2xl max-w-none text-center',
          components: MarkdownComponents(theme)
      }, slides[index])
    )

    contentWrapper.innerHTML = html
    container.appendChild(contentWrapper)
    document.body.appendChild(container)

    try {
      // Render the slide to canvas with higher scale for better quality
      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
          backgroundColor: theme?.styles.background || '#ffffff',
        logging: false,
      })

      // Convert canvas to base64 image
      const imgData = canvas.toDataURL('image/png', 1.0)

      // Add the image to the slide
      pptxSlide.addImage({
        data: imgData,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      })
    } finally {
      // Clean up
      document.body.removeChild(container)
      }
    }
  }

  // Save the PPTX
  await pptx.writeFile({ fileName: 'slides.pptx' })
} 