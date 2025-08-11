// Tiptap Table Extensions for YatraZone Admin
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

export const tableExtensions = [
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse border border-gray-300 table-auto w-full',
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: 'border border-gray-300',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 bg-gray-100 font-bold',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 p-2',
    },
  }),
];
