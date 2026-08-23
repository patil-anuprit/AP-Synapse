$ErrorActionPreference="Stop"
try {
  Add-Type -AssemblyName System.Speech
  $r=New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $c=New-Object System.Speech.Recognition.Choices
  $c.Add([string[]]@("hey aprisha","aprisha"))
  $b=New-Object System.Speech.Recognition.GrammarBuilder
  $b.Append($c)
  $g=New-Object System.Speech.Recognition.Grammar($b)
  $r.LoadGrammar($g)
  $r.SetInputToDefaultAudioDevice()
  $r.add_SpeechRecognized({
    param($sender,$e)
    if($null -ne $e.Result -and $e.Result.Confidence -ge 0.72){
      [Console]::Out.WriteLine("APRISHA_WAKE")
      [Console]::Out.Flush()
    }
  })
  [Console]::Out.WriteLine("APRISHA_WAKE_READY")
  [Console]::Out.Flush()
  $r.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  while($true){ Start-Sleep -Milliseconds 350 }
}
catch {
  [Console]::Out.WriteLine("APRISHA_WAKE_ERROR::"+$_.Exception.Message)
  [Console]::Out.Flush()
  exit 2
}
