' Liberty BASIC 4.5.1 grammar fixture - snapshot in sample.bas.snap
REM classic comment: with a colon
rem
remainder = 5 : premium = 2
print "it's not a comment" ' but this is
print "unterminated string
nomainwin

global title$, user.first$
dim scores(10), names$(10)
order = origin or android xor xoring and andy
result = not(a = b) and (c <> d) or (e <= f) or (g >= h)
total = 15 mod 4 + 2 ^ 3 - 7 * 1.5 / .25 + 1e5 + 2.5E-3
step$ = word$("a b c", 2) + left$ (title$, 1) + upper$(user.first$)
x = len(title$) + int(rnd(1) * 10)

[main]
    WindowWidth = 400 : WindowHeight = 300
    UpperLeftX = int((DisplayWidth - WindowWidth) / 2)
    BackgroundColor$ = "buttonface"
    stylebits #win, _WS_MAXIMIZEBOX, 0, 0, 0
    statictext #win.label, "Name:", 10, 10, 60, 24
    textbox #win.name, 80, 10, 200, 24
    button #win.ok, "OK", [okClick], UL, 10, 50, 80, 24
    menu #win, "&File", "E&xit", [quit]
    open title$ for window_nf as #win
    #win "trapclose [quit]"
    print #win.name, "!setfocus"
    timer 1000, [tick]
    wait

[okClick]
    #win.name "!contents? name$"
    var$ = "#win.ok"
    #var$ "disable"
    if name$ = "" then notice "Empty!" : goto [main]
    if len(name$) > 20 then [tooLong] else print "ok"
    call greet name$, 3
    wait

[tick]
    if Inkey$ <> "" then
        print "key"
    else
        print MouseX; ","; MouseY
    end if
    wait

10 REM numeric branch labels
20 for i = 10 to 1 step -.5
30 print i
40 next i

[files]
    open "data.txt" for input as #f
    while eof(#f) = 0
        line input #f, text$
        print inputto$(#f, ",")
    wend
    close #f
    open "out.txt" for append as #o : print #o, "x" : close #o
    open "rec.dat" for random as #r len = 128
    field #r, 20 as name$, 4 as age
    open "user32" for dll as #user32
    open "Gfx" for graphics_fs_nsb as #gfx

[dll]
    struct winRect, _
        orgX as long, _
        orgY as ulong
    winRect.orgX.struct = 100
    calldll #user32, "GetWindowRect", _
        hwnd(#win) as ulong, _
        winRect as struct, _
        result as long

[errors]
    on error goto [handler]
    do
        count = count + 1
        if count > 3 then exit do
    loop until count >= 10
    do while count > 0
        count = count - 1
    loop
    select case count
    case 1, 2
        print "low"
    case else
        print "Error: "; Err; " "; Err$
    end select
    gosub [sub.routine]
    end

[handler]
    resume

[sub.routine]
    return

[quit]
    close #win
    end

function greeting$(who$, byref n)
    if n = 0 then exit function
    greeting$ = "Hello, " + who$
end function

sub greet who$, times
    if times < 1 then exit sub else print "go"
    for t = 1 to times
        print greeting$(who$, t)
    next t
end sub

function f(x)
    f = x * 2
End Function

Sub s : End Sub
