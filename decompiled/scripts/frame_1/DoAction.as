ly_in_pc = 3.26;
arcsecField.restrict = "0123456789.";
parsecField.restrict = "0123456789.";
lightyearField.restrict = "0123456789.";
arcsecField.onChanged = function()
{
   var tmp = 1 / parseFloat(this.text);
   if(isFinite(tmp) && !isNaN(tmp))
   {
      parsecField.text = Math.toSigDigits(tmp,3);
      lightyearField.text = Math.toSigDigits(ly_in_pc * tmp,3);
   }
   else
   {
      parsecField.text = "...";
      lightyearField.text = "...";
   }
   updateAfterEvent();
};
parsecField.onChanged = function()
{
   var tmp = parseFloat(this.text);
   if(isFinite(tmp) && !isNaN(tmp))
   {
      if(tmp == 0)
      {
         arcsecField.text = "...";
         lightyearField.text = "0";
      }
      else
      {
         arcsecField.text = Math.toSigDigits(1 / tmp,3);
         lightyearField.text = Math.toSigDigits(ly_in_pc * tmp,3);
      }
   }
   else
   {
      arcsecField.text = "...";
      lightyearField.text = "...";
   }
   updateAfterEvent();
};
lightyearField.onChanged = function()
{
   var tmp = parseFloat(this.text);
   if(isFinite(tmp) && !isNaN(tmp))
   {
      if(tmp == 0)
      {
         arcsecField.text = "...";
         parsecField.text = "0";
      }
      else
      {
         arcsecField.text = Math.toSigDigits(ly_in_pc / tmp,3);
         parsecField.text = Math.toSigDigits(tmp / ly_in_pc,3);
      }
   }
   else
   {
      arcsecField.text = "...";
      parsecField.text = "...";
   }
   updateAfterEvent();
};
arcsecField.onSetFocus = function()
{
   if(this.text == "...")
   {
      this.text = "";
   }
};
parsecField.onSetFocus = function()
{
   if(this.text == "...")
   {
      this.text = "";
   }
};
lightyearField.onSetFocus = function()
{
   if(this.text == "...")
   {
      this.text = "";
   }
};
Math.toSigDigits = function()
{
   var num = parseFloat(arguments[0]);
   var digs = Math.abs(parseInt(arguments[1]));
   if(!isFinite(digs) || !isFinite(num))
   {
      return NaN;
   }
   if(num == 0 || digs == 0)
   {
      return 0;
   }
   if(digs > 15)
   {
      digs = 15;
   }
   var sign = 1;
   if(num < 0)
   {
      sign = -1;
      num = Math.abs(num);
   }
   var tmp = Math.floor(Math.log(num) / 2.302585092994046);
   var fact = Math.pow(10,digs - (1 + tmp));
   var num2 = Math.round(fact * num) / fact;
   return sign * num2;
};
