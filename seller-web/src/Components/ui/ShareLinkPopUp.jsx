import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog'
import { useState } from 'react';
import PropTypes from 'prop-types';



export default function ShareLinkPopUp({ open, onOpenChange, link, linkType = 'link' }) {
	const [copied, setCopied] = useState(false)

	const currentUrl = link

	const onCopied = () => {
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const copyToClipboard = async () => {
		if (!currentUrl) return
		try {
			await navigator.clipboard.writeText(currentUrl)
			onCopied()
		} catch {
			// ignore clipboard errors
		}
	}

	const Content = (
		<div className="relative w-full max-w-[734px] h-[212px] rounded-[1.25rem] bg-[#FFFFFF] text-white flex items-center justify-center px-6">
			<div className="absolute top-4 left-0 right-0 flex justify-between items-center w-full  px-6 pt-3">
				<DialogTitle asChild>
					<h3 className="text-black text-xl lg:text-2xl font-normal font-lexend ">Share {linkType} </h3>
				</DialogTitle>
				<button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="h-9 w-9 cursor-pointer inline-flex items-center justify-center rounded-full hover:bg-black/10">
					<svg width="20" height="20" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M26.25 8.75L8.75 26.25M8.75 8.75L26.25 26.25" stroke="black" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
			</div>
			<div className="flex-col items-center justify-center gap-6 w-full ">
				<DialogDescription className="sr-only">
					Share the current page link by copying it to your clipboard
				</DialogDescription>
				<div className="flex items-center justify-between border border-solid border-[#00000080] rounded-md gap-2 mt-[31px] py-2 px-3 w-full ">
					<input title='Share Link' readOnly value={currentUrl} className="text-black text-base lg:text-xl font-normal font-lexend bg-transparent outline-none truncate w-[calc(100%-90px)]" />
					<button onClick={copyToClipboard} className="px-4 py-2 bg-[#0BB248] text-white text-sm lg:text-base font-normal font-lexend rounded-full min-w-[84px] cursor-pointer hover:bg-[#0BB248]/80 transition-all duration-300">Copy</button>
				</div>
				{copied && (
					<div className="mt-2 flex items-center gap-2 text-green-600 font-lexend text-sm">
						<span>Link copied</span>
						<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M16.667 5.83333L8.33366 14.1667L3.33366 9.16667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</div>
				)}
			</div>
		</div>
	)

	if (!open) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="p-0 gap-0 border-0 bg-transparent max-w-[760px] w-[90vw]">
				{Content}
			</DialogContent>
		</Dialog>
	)
}

ShareLinkPopUp.propTypes = {
	open: PropTypes.bool.isRequired,
	onOpenChange: PropTypes.func.isRequired,
	link: PropTypes.string.isRequired,
	linkType: PropTypes.string.isRequired
}

