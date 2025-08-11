'use client'

import MDEditor from "@uiw/react-md-editor"

const MarkdownPreview = ({ value, className }) => {
    return (
        <>
            <MDEditor.Markdown
                className={className}
                source={value}
            />
        </>
    )
}

export default MarkdownPreview