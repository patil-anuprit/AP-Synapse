$ErrorActionPreference="Stop"
try {
  Add-Type -AssemblyName System.Speech
  $r=New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $r.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
  $r.SetInputToDefaultAudioDevice()
  $x=$r.Recognize([TimeSpan]::FromSeconds(9))
  if($null -ne $x -and -not [string]::IsNullOrWhiteSpace($x.Text)){
    [Console]::Out.WriteLine("APRISHA_TEXT::"+$x.Text.Trim())
  } else {
    [Console]::Out.WriteLine("APRISHA_TEXT::")
  }
  [Console]::Out.Flush()
}
catch {
  [Console]::Out.WriteLine("APRISHA_LISTEN_ERROR::"+$_.Exception.Message)
  [Console]::Out.Flush()
  exit 2
}
