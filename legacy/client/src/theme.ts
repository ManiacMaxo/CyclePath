import { createMuiTheme } from '@material-ui/core/styles'

export const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#35a331',
            contrastText: '#ffffff'
        },
        warning: {
            main: '#ff9800'
        }
    },
    typography: {
        fontFamily: ['Noto Sans JP', 'Roboto'].join(', '),
        subtitle1: {
            fontFamily: `'Akaya Telivigala', cursive`,
            textAlign: 'center',
            fontSize: '2rem',
            lineHeight: '1.25em'
        }
    }
})
